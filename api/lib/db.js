const { Pool } = require('pg');

// Reuse pool across warm serverless invocations
let pool;
const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 30000,
    });
    pool.on('error', (err) => console.error('Pool error:', err));
  }
  return pool;
};

const query = (text, params) => getPool().query(text, params);

module.exports = { query };
