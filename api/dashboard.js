const { query }              = require('../lib/db');
const { cors, authenticate } = require('../lib/helpers');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await authenticate(req, res);
  if (!user) return;

  try {
    const [totals, categories, recentScans] = await Promise.all([
      query(`SELECT COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status='In Use')      AS in_use,
        COUNT(*) FILTER (WHERE status='In Stock')    AS in_stock,
        COUNT(*) FILTER (WHERE status='Maintenance') AS maintenance,
        COUNT(*) FILTER (WHERE status='Retired')     AS retired,
        COUNT(*) FILTER (WHERE status='Lost')        AS lost
        FROM assets`),
      query(`SELECT category::text, COUNT(*) AS count FROM assets GROUP BY category`),
      query(`SELECT sl.*,a.name AS asset_name,a.asset_number,u.full_name AS user_name
             FROM scan_logs sl
             LEFT JOIN assets a ON sl.asset_id=a.id
             LEFT JOIN users  u ON sl.user_id=u.id
             ORDER BY sl.scan_time DESC LIMIT 10`),
    ]);
    const cat = {};
    categories.rows.forEach(r => { cat[r.category] = parseInt(r.count); });
    return res.json({ ...totals.rows[0], category_breakdown: cat, recent_scans: recentScans.rows });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};
