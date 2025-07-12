const { Pool } = require('pg');

// Use the connection string from the DB_URL environment variable. No fallback
// with credentials is provided to avoid leaking secrets in the repository.
const pool = new Pool({
  connectionString: process.env.DB_URL,
});

module.exports = pool;
