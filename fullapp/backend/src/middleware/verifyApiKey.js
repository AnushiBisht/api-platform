const bcrypt = require('bcryptjs');
const supabase = require('../config/db');

module.exports = async (req, res, next) => {
  const rawKey = req.headers['x-api-key'];
  if (!rawKey) return res.status(401).json({ error: 'Missing x-api-key header' });

  // Fetch all active keys (not revoked) — compare with bcrypt
  // In production with many keys, consider a faster lookup strategy
  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('id, key_hash, user_id, revoked_at')
    .is('revoked_at', null);

  if (error) return res.status(500).json({ error: 'Server error' });

  let matchedKey = null;
  for (const k of keys) {
    const match = await bcrypt.compare(rawKey, k.key_hash);
    if (match) { matchedKey = k; break; }
  }

  if (!matchedKey) return res.status(401).json({ error: 'Invalid API key' });

  // Load user for role info
  const { data: user } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', matchedKey.user_id)
    .single();

  if (!user) return res.status(401).json({ error: 'User not found' });

  req.user = { sub: user.id, email: user.email, role: user.role };
  req.apiKeyId = matchedKey.id;
  next();
};
