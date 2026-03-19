const { query }              = require('./lib/db');
const { cors, authenticate } = require('./lib/helpers');

// GET    /api/assets              → list
// POST   /api/assets              → create
// GET    /api/assets/AST-001      → single
// PUT    /api/assets/AST-001      → update
// DELETE /api/assets/AST-001      → delete
// GET    /api/assets/AST-001/scans → history
// POST   /api/assets/AST-001/scans → record

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await authenticate(req, res);
  if (!user) return;

  // Parse: /api/assets  /api/assets/AST-001  /api/assets/AST-001/scans
  const url      = req.url.split('?')[0].replace(/\/$/, '');
  const parts    = url.replace(/^\/api\/assets\/?/, '').split('/').filter(Boolean);
  const assetNum = parts[0] || null;
  const sub      = parts[1] || null;

  /* ── LIST ──────────────────────────────────────────────── */
  if (!assetNum && req.method === 'GET') {
    const { page=1, page_size=20, search, status, category, department } = req.query;
    const offset = (parseInt(page)-1) * parseInt(page_size);
    const cond=[]; const vals=[]; let n=1;

    if (search)     { cond.push(`(a.name ILIKE $${n} OR a.asset_number ILIKE $${n} OR a.serial_number ILIKE $${n})`); vals.push(`%${search}%`); n++; }
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
         ${where} ORDER BY a.created_at DESC LIMIT $${n} OFFSET $${n+1}`,
        [...vals, parseInt(page_size), offset]
      );
      return res.json({ total, page:parseInt(page), page_size:parseInt(page_size),
        total_pages:Math.ceil(total/parseInt(page_size)), items });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  /* ── CREATE ─────────────────────────────────────────────── */
  if (!assetNum && req.method === 'POST') {
    const { asset_number, name, description, category, status, manufacturer, model,
      serial_number, purchase_date, warranty_expiry, location, department, assigned_to, notes } = req.body||{};
    if (!asset_number || !name)
      return res.status(400).json({ error: 'asset_number and name required' });
    try {
      const dup = await query('SELECT id FROM assets WHERE asset_number=$1', [asset_number]);
      if (dup.rows.length) return res.status(400).json({ error: 'Asset number already exists' });
      const { rows:[a] } = await query(
        `INSERT INTO assets (asset_number,name,description,category,status,manufacturer,model,
          serial_number,purchase_date,warranty_expiry,location,department,assigned_to,notes)
         VALUES ($1,$2,$3,$4::asset_category,$5::asset_status,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [asset_number,name,description||null,category||'Hardware',status||'In Stock',
         manufacturer||null,model||null,serial_number||null,
         purchase_date||null,warranty_expiry||null,
         location||null,department||null,assigned_to||null,notes||null]
      );
      return res.status(201).json(a);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  if (!assetNum) return res.status(405).json({ error: 'Method not allowed' });

  /* ── SCANS ──────────────────────────────────────────────── */
  if (sub === 'scans') {
    const { rows:[asset] } = await query('SELECT id FROM assets WHERE asset_number=$1', [assetNum]);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    if (req.method === 'GET') {
      const { rows } = await query(
        `SELECT sl.*,u.full_name AS user_name FROM scan_logs sl
         LEFT JOIN users u ON sl.user_id=u.id
         WHERE sl.asset_id=$1 ORDER BY sl.scan_time DESC`, [asset.id]
      );
      return res.json(rows);
    }
    if (req.method === 'POST') {
      const { action, location, notes } = req.body||{};
      if (!action) return res.status(400).json({ error: 'action required' });
      const { rows:[log] } = await query(
        `INSERT INTO scan_logs (asset_id,user_id,action,location,notes) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [asset.id, user.id, action, location||null, notes||null]
      );
      return res.status(201).json(log);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  /* ── SINGLE GET ─────────────────────────────────────────── */
  if (req.method === 'GET') {
    const { rows:[a] } = await query(
      `SELECT a.*,u.full_name AS assigned_user_name,u.email AS assigned_user_email
       FROM assets a LEFT JOIN users u ON a.assigned_to=u.id WHERE a.asset_number=$1`, [assetNum]
    );
    if (!a) return res.status(404).json({ error: 'Asset not found' });
    return res.json(a);
  }

  /* ── UPDATE ─────────────────────────────────────────────── */
  if (req.method === 'PUT') {
    const FIELDS = ['name','description','category','status','manufacturer','model',
      'serial_number','purchase_date','warranty_expiry','location','department','assigned_to','notes'];
    const sets=[]; const vals=[]; let n=1;
    for (const f of FIELDS) {
      if ((req.body||{})[f] === undefined) continue;
      const v = req.body[f] === '' ? null : req.body[f];
      if (f==='category') sets.push(`${f}=$${n++}::asset_category`);
      else if (f==='status') sets.push(`${f}=$${n++}::asset_status`);
      else sets.push(`${f}=$${n++}`);
      vals.push(v);
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    const { rows:[updated] } = await query(
      `UPDATE assets SET ${sets.join(',')} WHERE asset_number=$${n} RETURNING *`,
      [...vals, assetNum]
    );
    if (!updated) return res.status(404).json({ error: 'Asset not found' });
    return res.json(updated);
  }

  /* ── DELETE ─────────────────────────────────────────────── */
  if (req.method === 'DELETE') {
    if (!user.is_admin) return res.status(403).json({ error: 'Admin required' });
    const { rows:[row] } = await query('DELETE FROM assets WHERE asset_number=$1 RETURNING id', [assetNum]);
    if (!row) return res.status(404).json({ error: 'Asset not found' });
    return res.json({ message: 'Deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
