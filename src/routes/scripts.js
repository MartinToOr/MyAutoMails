const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM scripts');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/', async (req, res) => {
  const { user_id, script, period, next_execution, emails } = req.body;
  try {
    await pool.query(
      'INSERT INTO scripts(user_id, script, period, next_execution, emails) VALUES (?, ?, ?, ?, ?)',
      [user_id, script, period, next_execution, emails]
    );
    res.status(201).json({ message: 'Script created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
