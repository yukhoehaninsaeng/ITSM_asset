const { cors, authenticate } = require('../lib/helpers');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = await authenticate(req, res);
  if (!user) return;
  const { hashed_password, ...safe } = user;
  return res.json(safe);
};
