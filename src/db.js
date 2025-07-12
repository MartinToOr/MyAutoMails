const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'postgresql://neondb_owner:npg_9Sdfukrgl4ne@ep-damp-hat-a2skbnsr-pooler.eu-central-1.aws.neon.tech/MyAutoMails?sslmode=require&channel_binding=require',
  user: process.env.DB_USER || 'neondb_owner',
  password: process.env.DB_PASSWORD || 'npg_9Sdfukrgl4ne',
  database: process.env.DB_NAME || 'MyAutoMails',
});

module.exports = pool;
