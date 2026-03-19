const { cors, authenticate } = require('../lib/helpers');
const { query } = require('../lib/db');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = await authenticate(req, res);
  if (!user) return;

  const { assetNumber } = req.query;

  if (req.method === 'GET') {
    try {
      const { rows:[asset] } = await query(
        `SELECT a.*,u.full_name AS assigned_user_name,u.email AS assigned_user_email
         FROM assets a LEFT JOIN users u ON a.assigned_to=u.id
         WHERE a.asset_number=$1`, [assetNumber]
      );
      if (!asset) return res.status(404).json({ error: 'Asset not found' });
      return res.json(asset);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  if (req.method === 'PUT') {
    const FIELDS = ['name','description','category','status','manufacturer','model',
      'serial_number','purchase_date','warranty_expiry','location','department','assigned_to','notes'];
    const sets=[]; const vals=[]; let n=1;
    const body = req.body || {};
    for (const f of FIELDS) {
      if (body[f] === undefined) continue;
      const v = body[f] === '' ? null : body[f];
      if (f === 'category') sets.push(`${f}=$${n++}::asset_category`);
      else if (f === 'status') sets.push(`${f}=$${n++}::asset_status`);
      else sets.push(`${f}=$${n++}`);
      vals.push(v);
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    try {
      const { rows:[updated] } = await query(
        `UPDATE assets SET ${sets.join(',')} WHERE asset_number=$${n} RETURNING *`,
        [...vals, assetNumber]
      );
      if (!updated) return res.status(404).json({ error: 'Asset not found' });
      return res.json(updated);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  if (req.method === 'DELETE') {
    if (!user.is_admin) return res.status(403).json({ error: 'Admin required' });
    try {
      const { rows:[row] } = await query(
        'DELETE FROM assets WHERE asset_number=$1 RETURNING id', [assetNumber]
      );
      if (!row) return res.status(404).json({ error: 'Asset not found' });
      return res.json({ message: 'Deleted' });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
