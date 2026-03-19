const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query }              = require('../lib/db');
const { cors, authenticate } = require('../lib/helpers');

// POST /api/auth?action=login
// POST /api/auth?action=register
// GET  /api/auth?action=me
// GET  /api/auth?action=users

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;

  if (action === 'login' && req.method === 'POST') {
    const { username, password } = req.body || {};
    if (!username || !password)
      return res.status(400).json({ error: 'username and password required' });
    try {
      const { rows } = await query('SELECT * FROM users WHERE username=$1 AND is_active=true', [username]);
      const user = rows[0];
      if (!user || !(await bcrypt.compare(password, user.hashed_password)))
        return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
      const { hashed_password, ...safe } = user;
      return res.json({ access_token: token, token_type: 'bearer', user: safe });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  if (action === 'register' && req.method === 'POST') {
    const { username, email, full_name, password, department, is_admin } = req.body || {};
    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email, password required' });
    try {
      const dup = await query('SELECT id FROM users WHERE username=$1 OR email=$2', [username, email]);
      if (dup.rows.length) return res.status(400).json({ error: 'Username or email already taken' });
      const { rows: [{ count }] } = await query('SELECT COUNT(*) FROM users');
      const hashed = await bcrypt.hash(password, 10);
      const { rows: [created] } = await query(
        `INSERT INTO users (username,email,full_name,hashed_password,department,is_admin)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id,username,email,full_name,is_admin,is_active,department,created_at`,
        [username, email, full_name||null, hashed, department||null, parseInt(count)===0 || !!is_admin]
      );
      return res.status(201).json(created);
    } catch (err) { return res.status(500).json({ error: err.message }); }
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
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  return res.status(400).json({ error: 'Unknown action or method' });
};
