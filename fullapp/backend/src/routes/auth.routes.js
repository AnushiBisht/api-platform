const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const supabase = require('../config/db');
const verifyJWT = require('../middleware/verifyJWT');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  blacklistToken,
  isBlacklisted,
} = require('../services/token.service');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

// ─── Register ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 8)  return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, password_hash: passwordHash })
    .select('id, email, role')
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    return res.status(500).json({ error: 'Registration failed' });
  }

  const accessToken  = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res
    .cookie('access_token',  accessToken,  { ...COOKIE_OPTS, maxAge: 4 * 60 * 60 * 1000 })
    .cookie('refresh_token', refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .status(201)
    .json({ user: { id: user.id, email: user.email, role: user.role } });
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash, role')
    .eq('email', email)
    .single();

  if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken  = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res
    .cookie('access_token',  accessToken,  { ...COOKIE_OPTS, maxAge: 4 * 60 * 60 * 1000 })
    .cookie('refresh_token', refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .json({ user: { id: user.id, email: user.email, role: user.role } });
});

// ─── Refresh ─────────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  try {
    if (await isBlacklisted(token)) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    const decoded = verifyRefreshToken(token);

    const { data: user } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.sub)
      .single();

    if (!user) return res.status(401).json({ error: 'User not found' });

    const newAccessToken = signAccessToken(user);
    res
      .cookie('access_token', newAccessToken, { ...COOKIE_OPTS, maxAge: 4 * 60 * 60 * 1000 })
      .json({ ok: true });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ─── Logout ──────────────────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (token) await blacklistToken(token).catch(() => {});
  res
    .clearCookie('access_token')
    .clearCookie('refresh_token')
    .json({ ok: true });
});

// ─── Me ──────────────────────────────────────────────────────────────────────
router.get('/me', verifyJWT, async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .eq('id', req.user.sub)
    .single();

  res.json({ user });
});

module.exports = router;
