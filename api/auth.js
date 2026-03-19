const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('./lib/db');
const { cors, authenticate } = require('./lib/helpers');

const toErrorPayload = (err) => {
  const message = err?.message || 'Unexpected server error';
  const payload = {
    error: message,
    code: err?.code || null,
    detail: err?.detail || null,
  };

  if (err?.code === '42P01') {
    payload.hint = 'Database schema is missing. Run supabase_init.sql in the Supabase SQL Editor.';
  } else if (/Invalid format for user or db_name/i.test(message)) {
    payload.hint = 'DATABASE_URL is invalid. Use the Supabase Connect > Transaction pooler URI exactly as provided.';
  } else if (/password authentication failed/i.test(message)) {
    payload.hint = 'The database password inside DATABASE_URL is wrong. Reset the DB password in Supabase and update Vercel.';
  } else if (/getaddrinfo|ENOTFOUND|ECONNREFUSED|connect timeout/i.test(message)) {
    payload.hint = 'The database host is unreachable. Recheck the Supabase host, port, and project status.';
  }

  return payload;
};

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;

  if (action === 'login' && req.method === 'POST') {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL environment variable is missing' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET environment variable is missing' });
    }

    try {
      const { rows } = await query(
        'SELECT * FROM users WHERE username=$1 AND is_active=true',
        [username]
      );

      const user = rows[0];
      if (!user || !(await bcrypt.compare(password, user.hashed_password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: '24h',
      });
      const { hashed_password, ...safe } = user;
      return res.json({ access_token: token, token_type: 'bearer', user: safe });
    } catch (err) {
      return res.status(500).json(toErrorPayload(err));
    }
  }

  if (action === 'register' && req.method === 'POST') {
    const { username, email, full_name, password, department, is_admin } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, password required' });
    }

    try {
      const dup = await query('SELECT id FROM users WHERE username=$1 OR email=$2', [
        username,
        email,
      ]);
      if (dup.rows.length) {
        return res.status(400).json({ error: 'Username or email already taken' });
      }

      const {
        rows: [{ count }],
      } = await query('SELECT COUNT(*) FROM users');
      const hashed = await bcrypt.hash(password, 10);
      const {
        rows: [created],
      } = await query(
        `INSERT INTO users (username,email,full_name,hashed_password,department,is_admin)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id,username,email,full_name,is_admin,is_active,department,created_at`,
        [
          username,
          email,
          full_name || null,
          hashed,
          department || null,
          parseInt(count, 10) === 0 || !!is_admin,
        ]
      );
      return res.status(201).json(created);
    } catch (err) {
      return res.status(500).json(toErrorPayload(err));
    }
  }

  if (action === 'health' && req.method === 'GET') {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: 'DATABASE_URL environment variable is missing' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ ok: false, error: 'JWT_SECRET environment variable is missing' });
    }

    try {
      const userCount = await query('SELECT COUNT(*)::int AS count FROM users');
      return res.json({
        ok: true,
        database: 'reachable',
        users: userCount.rows[0]?.count ?? 0,
      });
    } catch (err) {
      return res.status(500).json({ ok: false, ...toErrorPayload(err) });
    }
  }

  if (action === 'me' && req.method === 'GET') {
    const user = await authenticate(req, res);
    if (!user) return;
    const { hashed_password, ...safe } = user;
    return res.json(safe);
  }

  if (action === 'users' && req.method === 'GET') {
    const user = await authenticate(req, res);
    if (!user) return;

    try {
      const { rows } = await query(
        'SELECT id,username,email,full_name,department,is_admin,is_active,created_at FROM users ORDER BY created_at'
      );
      return res.json(rows);
    } catch (err) {
      return res.status(500).json(toErrorPayload(err));
    }
  }

  return res.status(400).json({ error: 'Unknown action or method' });
};
