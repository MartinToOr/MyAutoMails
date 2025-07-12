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
  const { script, frequency, hour, emails } = req.body;
  const userId = req.session.user.id;
  const periods = { daily: 24, weekly: 24 * 7, monthly: 24 * 30 };
  const period = periods[frequency] || 24;
  const now = new Date();
  let next = new Date();
  next.setHours(hour, 0, 0, 0);
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

module.exports = router;
