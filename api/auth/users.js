const { cors, authenticate } = require('../lib/helpers');
const { query } = require('../lib/db');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = await authenticate(req, res);
  if (!user) return;
  try {
    const { rows } = await query(
      'SELECT id,username,email,full_name,department,is_admin,is_active,created_at FROM users ORDER BY created_at'
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
