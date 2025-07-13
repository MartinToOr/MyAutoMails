const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const scriptRoutes = require('./routes/scripts');
const historyRoutes = require('./routes/history');
const scheduler = require('./scheduler');
const session = require('express-session');
const pool = require('./db');

const app = express();
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
}));
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/history', historyRoutes);

const PORT = process.env.PORT || 3000;
async function start() {
  await pool.query(`CREATE TABLE IF NOT EXISTS test_runs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    run_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await pool.query(`CREATE TABLE IF NOT EXISTS email_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    script_id INTEGER NOT NULL REFERENCES scripts(id),
    response TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// start scheduler
scheduler.start();
start();
