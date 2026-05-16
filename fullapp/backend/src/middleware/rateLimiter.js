const redis = require('../config/redis');

const LIMITS = {
  FREE:  100,
  PRO:   2000,
  ADMIN: Infinity,
};

module.exports = async (req, res, next) => {
  const userId = req.user.sub;
  const role   = req.user.role || 'FREE';
  const limit  = LIMITS[role] ?? 100;

  if (limit === Infinity) return next();

  const today = new Date().toISOString().slice(0, 10);
  const key   = `rate:${userId}:${today}`;

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 86400); // reset at midnight-ish

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));

  if (count > limit) {
    return res.status(429).json({
      error: 'Daily rate limit exceeded',
      limit,
      resetAt: `${today}T23:59:59Z`,
    });
  }

  next();
};
