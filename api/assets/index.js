const { cors, authenticate } = require('../lib/helpers');
const { query } = require('../lib/db');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = await authenticate(req, res);
  if (!user) return;

  /* ── GET list ─────────────────────────────────────────────── */
  if (req.method === 'GET') {
    const { page=1, page_size=20, search, status, category, department } = req.query;
    const offset = (parseInt(page)-1) * parseInt(page_size);
    const cond=[]; const vals=[]; let n=1;

    if (search) {
      cond.push(`(a.name ILIKE $${n} OR a.asset_number ILIKE $${n} OR a.serial_number ILIKE $${n})`);
      vals.push(`%${search}%`); n++;
    }
    if (status)     { cond.push(`a.status=$${n++}::asset_status`);     vals.push(status); }
    if (category)   { cond.push(`a.category=$${n++}::asset_category`); vals.push(category); }
    if (department) { cond.push(`a.department ILIKE $${n++}`);         vals.push(`%${department}%`); }

    const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';

    try {
      const { rows:[{count}] } = await query(`SELECT COUNT(*) FROM assets a ${where}`, vals);
      const total = parseInt(count);
      const { rows: items } = await query(
        `SELECT a.*,u.full_name AS assigned_user_name,u.email AS assigned_user_email
         FROM assets a LEFT JOIN users u ON a.assigned_to=u.id
         ${where} ORDER BY a.created_at DESC
         LIMIT $${n} OFFSET $${n+1}`,
        [...vals, parseInt(page_size), offset]
      );
      return res.json({ total, page:parseInt(page), page_size:parseInt(page_size),
        total_pages:Math.ceil(total/parseInt(page_size)), items });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  /* ── POST create ──────────────────────────────────────────── */
  if (req.method === 'POST') {
    const { asset_number, name, description, category, status, manufacturer, model,
      serial_number, purchase_date, warranty_expiry, location, department, assigned_to, notes } = req.body||{};
    if (!asset_number || !name)
      return res.status(400).json({ error: 'asset_number and name are required' });

    try {
      const dup = await query('SELECT id FROM assets WHERE asset_number=$1', [asset_number]);
      if (dup.rows.length) return res.status(400).json({ error: 'Asset number already exists' });

      const { rows:[created] } = await query(
        `INSERT INTO assets
           (asset_number,name,description,category,status,manufacturer,model,
            serial_number,purchase_date,warranty_expiry,location,department,assigned_to,notes)
         VALUES ($1,$2,$3,$4::asset_category,$5::asset_status,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [asset_number,name,description||null,category||'Hardware',status||'In Stock',
         manufacturer||null,model||null,serial_number||null,
         purchase_date||null,warranty_expiry||null,
         location||null,department||null,assigned_to||null,notes||null]
      );
      return res.status(201).json(created);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
