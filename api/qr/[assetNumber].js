const QRCode = require('qrcode');
const { cors, authenticate } = require('../lib/helpers');
const { query } = require('../lib/db');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await authenticate(req, res);
  if (!user) return;

  const { assetNumber } = req.query;
  const baseUrl = req.query.base_url || process.env.APP_URL || `https://${req.headers.host}`;

  const { rows:[asset] } = await query('SELECT id FROM assets WHERE asset_number=$1', [assetNumber]);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  try {
    const buf = await QRCode.toBuffer(`${baseUrl}/scan/${assetNumber}`, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 2,
      color: { dark: '#1a292b', light: '#ffffff' },
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(buf);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
