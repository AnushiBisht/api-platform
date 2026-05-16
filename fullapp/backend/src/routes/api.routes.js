const router      = require('express').Router();
const axios       = require('axios');
const verifyJWT   = require('../middleware/verifyJWT');
const verifyApiKey = require('../middleware/verifyApiKey');
const rateLimiter  = require('../middleware/rateLimiter');
const { logUsage } = require('../services/usage.service');

// Accepts either a JWT cookie (dashboard) or x-api-key header (programmatic)
const authenticate = (req, res, next) => {
  if (req.headers['x-api-key']) return verifyApiKey(req, res, next);
  return verifyJWT(req, res, next);
};

// ─── POST /api/summarize ──────────────────────────────────────────────────────
router.post('/summarize', authenticate, rateLimiter, async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: 'Text must be at least 50 characters' });
  }

  const startTime = Date.now();
  let status = 200;

  try {
    const mlRes = await axios.post(
      `${process.env.ML_SERVICE_URL}/predict`,
      { text },
      {
        headers: { Authorization: `Bearer ${req.cookies?.access_token || 'api-key-auth'}` },
        timeout: 30000,
      }
    );

    const latencyMs = Date.now() - startTime;

    // Log usage async — don't await, don't block the response
    logUsage({
      userId:    req.user.sub,
      apiKeyId:  req.apiKeyId || null,
      endpoint:  '/api/summarize',
      status:    200,
      latencyMs,
    }).catch(() => {});

    return res.json({
      summary:   mlRes.data.summary,
      latency_ms: latencyMs,
    });
  } catch (err) {
    status = err.response?.status || 500;
    logUsage({
      userId:   req.user.sub,
      apiKeyId: req.apiKeyId || null,
      endpoint: '/api/summarize',
      status,
      latencyMs: Date.now() - startTime,
    }).catch(() => {});

    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'ML service unavailable' });
    }
    return res.status(500).json({ error: 'Summarization failed' });
  }
});

module.exports = router;
