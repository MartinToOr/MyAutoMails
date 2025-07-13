const express = require('express');
const pool = require('../db');
const router = express.Router();

router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM email_history WHERE user_id=$1 ORDER BY sent_at DESC', [req.session.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
