const bcrypt = require('bcryptjs');
const { query } = require('../lib/db');
const { cors }  = require('../lib/helpers');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { username, email, full_name, password, department, is_admin } = req.body || {};
  if (!username || !email || !password)
    return res.status(400).json({ error: 'username, email, password are required' });

  try {
    const dup = await query('SELECT id FROM users WHERE username=$1 OR email=$2', [username, email]);
    if (dup.rows.length) return res.status(400).json({ error: 'Username or email already taken' });

    const { rows: [{ count }] } = await query('SELECT COUNT(*) FROM users');
    const isFirst = parseInt(count) === 0;
    const hashed  = await bcrypt.hash(password, 10);

    const { rows: [created] } = await query(
      `INSERT INTO users (username,email,full_name,hashed_password,department,is_admin)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id,username,email,full_name,is_admin,is_active,department,created_at`,
      [username, email, full_name||null, hashed, department||null, isFirst || !!is_admin]
    );
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
