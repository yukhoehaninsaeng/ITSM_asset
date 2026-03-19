const QRCode = require('qrcode');
const { query }              = require('./lib/db');
const { cors, authenticate } = require('./lib/helpers');

// GET /api/qr?asset=AST-001&base_url=https://...  → PNG  (auth required)
// GET /api/qr?asset=AST-001&action=info           → JSON (no auth)

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { asset: assetNumber, action, base_url } = req.query;
  if (!assetNumber) return res.status(400).json({ error: 'asset query param required' });

  /* ── Public info (no auth) ──────────────────────────────── */
  if (action === 'info') {
    try {
      const { rows:[a] } = await query(
        `SELECT a.asset_number,a.name,a.status,a.category,a.location,a.department,
                a.manufacturer,a.model,u.full_name AS assigned_user_name
         FROM assets a LEFT JOIN users u ON a.assigned_to=u.id
         WHERE a.asset_number=$1`, [assetNumber]
      );
      if (!a) return res.status(404).json({ error: 'Asset not found', found: false });
      return res.json({ ...a, found: true });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  /* ── QR PNG (auth required) ─────────────────────────────── */
  const user = await authenticate(req, res);
  if (!user) return;

  const { rows:[asset] } = await query('SELECT id FROM assets WHERE asset_number=$1', [assetNumber]);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const appUrl = base_url || `https://${req.headers.host}`;
  try {
    const buf = await QRCode.toBuffer(`${appUrl}/scan/${assetNumber}`, {
      errorCorrectionLevel: 'M', width: 300, margin: 2,
      color: { dark: '#1a292b', light: '#ffffff' },
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(buf);
  } catch (err) { return res.status(500).json({ error: err.message }); }
};
