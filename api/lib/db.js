const { Pool } = require('pg');

let pool;

const normalizeConnectionString = (value) => {
  const connStr = (value || '').trim().replace(/^['"]|['"]$/g, '');
  if (!connStr) return connStr;

  try {
    const url = new URL(connStr);

    // Backward compatibility for an older example that mixed
    // Supabase session-mode credentials with the transaction-mode port.
    if (
      url.protocol.startsWith('postgres') &&
      /\.pooler\.supabase\.com$/i.test(url.hostname) &&
      url.port === '6543' &&
      url.username.startsWith('postgres.')
    ) {
      const projectRef = url.username.slice('postgres.'.length);
      if (projectRef) {
        url.username = 'postgres';
        url.hostname = `db.${projectRef}.supabase.co`;
      }
    }

    return url.toString();
  } catch {
    return connStr;
  }
};

const getPool = () => {
  if (!pool) {
    const connStr = normalizeConnectionString(process.env.DATABASE_URL);

    pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 30000,
    });

    pool.on('error', (err) => console.error('Pool error:', err.message));
  }

  return pool;
};

const query = (text, params) => getPool().query(text, params);

module.exports = { query };
