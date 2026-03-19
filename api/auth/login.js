const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query }            = require('../lib/db');
const { cors }             = require('../lib/helpers');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  try {
    const { rows } = await query(
      'SELECT * FROM users WHERE username=$1 AND is_active=true', [username]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.hashed_password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const { hashed_password, ...safe } = user;
    return res.json({ access_token: token, token_type: 'bearer', user: safe });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
