const { cors, authenticate } = require('../../lib/helpers');
const { query } = require('../../lib/db');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = await authenticate(req, res);
  if (!user) return;

  const { assetNumber } = req.query;
  const { rows:[asset] } = await query('SELECT id FROM assets WHERE asset_number=$1', [assetNumber]);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  if (req.method === 'POST') {
    const { action, location, notes } = req.body||{};
    if (!action) return res.status(400).json({ error: 'action is required' });
    try {
      const { rows:[log] } = await query(
        `INSERT INTO scan_logs (asset_id,user_id,action,location,notes)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [asset.id, user.id, action, location||null, notes||null]
      );
      return res.status(201).json(log);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  if (req.method === 'GET') {
    try {
      const { rows } = await query(
        `SELECT sl.*,u.full_name AS user_name
         FROM scan_logs sl LEFT JOIN users u ON sl.user_id=u.id
         WHERE sl.asset_id=$1 ORDER BY sl.scan_time DESC`,
        [asset.id]
      );
      return res.json(rows);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
