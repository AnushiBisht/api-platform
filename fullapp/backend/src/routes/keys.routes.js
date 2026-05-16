const router   = require('express').Router();
const crypto   = require('crypto');
const bcrypt   = require('bcryptjs');
const supabase = require('../config/db');
const verifyJWT = require('../middleware/verifyJWT');

// All key routes require JWT auth (dashboard users only)
router.use(verifyJWT);

// ─── Generate new API key ─────────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
  const { label } = req.body;
  console.log('Generating key for user:', req.user);
  console.log('Label:', label);
  
  if (!label) return res.status(400).json({ error: 'Label is required' });

  const rawKey  = `aip_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = await bcrypt.hash(rawKey, 10);

  console.log('Inserting into DB...');
  
  const { data, error } = await supabase
    .from('api_keys')
    .insert({ user_id: req.user.sub, key_hash: keyHash, label })
    .select('id, label, created_at')
    .single();

  console.log('DB result:', data, error);

  if (error) return res.status(500).json({ error: 'Failed to generate key' });

  res.status(201).json({ key: rawKey, id: data.id, label: data.label, created_at: data.created_at });
});

// ─── List active keys ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, label, created_at, revoked_at')
    .eq('user_id', req.user.sub)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch keys' });

  res.json({ keys: data });
});

// ─── Revoke a key ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user.sub); // ensures user can only revoke their own keys

  if (error) return res.status(500).json({ error: 'Failed to revoke key' });

  res.json({ ok: true });
});

module.exports = router;
