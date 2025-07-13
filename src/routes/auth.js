const express = require('express');
const pool = require('../db');
const router = express.Router();
const bcrypt = require('bcryptjs');

router.post('/register', async (req, res) => {
  const { name, email, password, plan } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users(name, email, password, plan) VALUES ($1, $2, $3, $4)',
      [name, email, hash, plan]
    );
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    req.session.user = { id: user.id, name: user.name, plan: user.plan, created_at: user.created_at };
    res.status(201).json({ message: 'User registered', user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.user = { id: user.id, name: user.name, plan: user.plan, created_at: user.created_at };
    res.json({ message: 'Login successful', user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

router.get('/session', (req, res) => {
  res.json({ user: req.session.user || null });
});

module.exports = router;
