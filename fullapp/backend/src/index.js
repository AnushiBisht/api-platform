require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');

// Boot connections
require('./config/redis');

const authRoutes  = require('./routes/auth.routes');
const keysRoutes  = require('./routes/keys.routes');
const apiRoutes   = require('./routes/api.routes');
const usageRoutes = require('./routes/usage.routes');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth',  authRoutes);
app.use('/keys',  keysRoutes);
app.use('/api',   apiRoutes);
app.use('/usage', usageRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend → http://localhost:${PORT}`));
