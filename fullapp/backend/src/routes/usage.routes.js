const router    = require('express').Router();
const verifyJWT = require('../middleware/verifyJWT');
const { getUsageStats, getTodayCount } = require('../services/usage.service');

router.use(verifyJWT);

// ─── GET /usage/stats ─────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [stats, todayCount] = await Promise.all([
      getUsageStats(req.user.sub),
      getTodayCount(req.user.sub),
    ]);
    res.json({ stats, todayCount });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
