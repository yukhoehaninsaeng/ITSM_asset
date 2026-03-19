const jwt = require('jsonwebtoken');
const { query } = require('./db');

/** Attach CORS headers to every response */
const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

/** Verify JWT, load user from DB. Returns user row or null (already sent 401). */
const authenticate = async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return null;
  }
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [payload.userId]
    );
    if (!result.rows[0]) {
      res.status(401).json({ error: 'User not found' });
      return null;
    }
    return result.rows[0];
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
};

module.exports = { cors, authenticate };
