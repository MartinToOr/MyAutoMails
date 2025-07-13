const express = require('express');
const pool = require('../db');
const router = express.Router();

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

router.post('/', async (req, res) => {

  const { script, frequency, hour, minute, emails, timezone } = req.body;
  if (minute % 5 !== 0) {
    return res.status(400).json({ error: 'Minute must be multiple of 5' });
  }
  const userId = req.session.user.id;
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
