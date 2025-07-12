const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DB_URL ||
    'postgresql://neondb_owner:npg_9Sdfukrgl4ne@ep-damp-hat-a2skbnsr-pooler.eu-central-1.aws.neon.tech/MyAutoMails?sslmode=require&channel_binding=require',
});

module.exports = pool;
