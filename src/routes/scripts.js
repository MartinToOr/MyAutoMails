const express = require('express');
const pool = require('../db');
const OpenAI = require('openai');
const router = express.Router();


const LIMITS = {
  free: { input: 300, output: 500 },
  pro: { input: 600, output: 0 },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY || 'YOUR_API_KEY',
});

router.use((req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
});
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM scripts WHERE user_id = $1', [req.session.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/test', async (req, res) => {
  const { script } = req.body;
  const userId = req.session.user.id;

  const plan = req.session.user.plan || 'free';
  if (script.length > LIMITS[plan].input) {
    return res.status(400).json({ error: 'Script too long' });
  }

  try {
    const { rows } = await pool.query("SELECT COUNT(*) FROM test_runs WHERE user_id=$1 AND run_at > NOW() - INTERVAL '1 day'", [userId]);
    if (parseInt(rows[0].count, 10) >= 3) {
      return res.status(429).json({ error: 'Daily test limit reached' });
    }
    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      instructions: 'Responde de forma natural sin mencionar que eres una IA. Usa la fecha actual y prioriza información del día de hoy o hasta tres días atrás.',
      input: script,
      tools: [{ type: 'web_search_preview' }],
    });
    let answer = completion.output_text;
    if (LIMITS[plan].output && answer.length > LIMITS[plan].output) {
      answer = answer.slice(0, LIMITS[plan].output) + '\nActualiza al plan pro para eliminar límites.';
    }

    await pool.query('INSERT INTO test_runs(user_id) VALUES ($1)', [userId]);
    res.json({ response: answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OpenAI error' });
  }
});

router.post('/', async (req, res) => {

  const { script, frequency, hour, minute, emails, timezone } = req.body;
  if (minute % 5 !== 0) {
    return res.status(400).json({ error: 'Minute must be multiple of 5' });
  }
  const userId = req.session.user.id;
  const plan = req.session.user.plan || 'free';
  if (script.length > LIMITS[plan].input) {
    return res.status(400).json({ error: 'Script too long' });
  }
  if (plan === 'free') {
    const { rows } = await pool.query('SELECT period FROM scripts WHERE user_id=$1', [userId]);
    const dailyCount = rows.filter(r => r.period === 24).length;
    const weeklyCount = rows.filter(r => r.period === 24 * 7).length;
    if ((frequency === 'daily' && dailyCount >= 1) || (frequency === 'weekly' && weeklyCount >= 1) || frequency === 'monthly') {
      return res.status(403).json({ error: 'Free plan limit reached' });
    }
    const { rows: urows } = await pool.query('SELECT created_at FROM users WHERE id=$1', [userId]);
    const created = new Date(urows[0].created_at);
    if (Date.now() - created.getTime() > 90 * 24 * 3600 * 1000) {
      return res.status(403).json({ error: 'Account expired' });
    }
  }
  const periods = { daily: 24, weekly: 24 * 7, monthly: 24 * 30 };
  const period = periods[frequency] || 24;
  const offset = parseInt(timezone || 0, 10);
  const now = new Date();
  let next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute || 0));
  next.setUTCMinutes(next.getUTCMinutes() + offset);

  if (next <= now) {
    if (frequency === 'daily') next.setDate(next.getDate() + 1);
    else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
    else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  }
  try {
    await pool.query(
      'INSERT INTO scripts(user_id, script, period, next_execution, emails) VALUES ($1, $2, $3, $4, $5)',
      [userId, script, period, next, emails]
    );
    res.status(201).json({ message: 'Script created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.put('/:id', async (req, res) => {

  const { script, frequency, hour, minute, emails, timezone } = req.body;
  if (minute % 5 !== 0) {
    return res.status(400).json({ error: 'Minute must be multiple of 5' });
  }
  const userId = req.session.user.id;
  const plan = req.session.user.plan || 'free';
  if (script.length > LIMITS[plan].input) {
    return res.status(400).json({ error: 'Script too long' });
  }
  if (plan === 'free') {
    if (frequency === 'monthly') return res.status(403).json({ error: 'Free plan limit reached' });
    const { rows: urows } = await pool.query('SELECT created_at FROM users WHERE id=$1', [userId]);
    const created = new Date(urows[0].created_at);
    if (Date.now() - created.getTime() > 90 * 24 * 3600 * 1000) {
      return res.status(403).json({ error: 'Account expired' });
    }
  }
  const periods = { daily: 24, weekly: 24 * 7, monthly: 24 * 30 };
  const period = periods[frequency] || 24;
  const offset = parseInt(timezone || 0, 10);
  let next = new Date();
  next = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate(), hour, minute || 0));
  next.setUTCMinutes(next.getUTCMinutes() + offset);

  const now = new Date();
  if (next <= now) {
    if (frequency === 'daily') next.setDate(next.getDate() + 1);
    else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
    else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  }
  try {
    await pool.query(
      'UPDATE scripts SET script=$1, period=$2, next_execution=$3, emails=$4 WHERE id=$5 AND user_id=$6',
      [script, period, next, emails, req.params.id, userId]
    );
    res.json({ message: 'Script updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
