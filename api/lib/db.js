const { Pool } = require('pg');

let pool;

const getPool = () => {
  if (!pool) {
    // connectionString 대신 개별 파라미터로 분리 — 특수문자 문제 우회
    const connStr = process.env.DATABASE_URL || '';

    // postgresql://user:password@host:port/dbname 파싱
    let config;
    try {
      const url = new URL(connStr);
      config = {
        user:     decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        host:     url.hostname,
        port:     parseInt(url.port) || 5432,
        database: url.pathname.replace(/^\//, ''),
        ssl:      { rejectUnauthorized: false },
        max:      3,
        idleTimeoutMillis: 30000,
      };
    } catch {
      // fallback: connectionString 그대로 사용
      config = {
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        max: 3,
        idleTimeoutMillis: 30000,
      };
    }

    pool = new Pool(config);
    pool.on('error', (err) => console.error('Pool error:', err.message));
  }
  return pool;
};

const query = (text, params) => getPool().query(text, params);

module.exports = { query };
