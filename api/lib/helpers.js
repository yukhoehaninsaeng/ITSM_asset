const jwt   = require('jsonwebtoken');
const { query } = require('./db');

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const authenticate = async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return null;
  }
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query(
      'SELECT * FROM users WHERE id=$1 AND is_active=true', [payload.userId]
    );
    if (!rows[0]) { res.status(401).json({ error: 'User not found' }); return null; }
    return rows[0];
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
};

module.exports = { cors, authenticate };
