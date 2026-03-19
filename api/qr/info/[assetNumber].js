const { cors } = require('../../lib/helpers');
const { query } = require('../../lib/db');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { assetNumber } = req.query;
  try {
    const { rows:[asset] } = await query(
      `SELECT a.asset_number,a.name,a.status,a.category,a.location,a.department,
              a.manufacturer,a.model,u.full_name AS assigned_user_name
       FROM assets a LEFT JOIN users u ON a.assigned_to=u.id
       WHERE a.asset_number=$1`,
      [assetNumber]
    );
    if (!asset) return res.status(404).json({ error: 'Asset not found', found: false });
    return res.json({ ...asset, found: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
