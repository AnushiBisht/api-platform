const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

const signAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, role: user.role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '4h' }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// Add refresh token to Redis blacklist on logout
const blacklistToken = async (token) => {
  const decoded = verifyRefreshToken(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) await redis.setEx(`bl:${token}`, ttl, '1');
};

const isBlacklisted = async (token) => {
  const result = await redis.get(`bl:${token}`);
  return result !== null;
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  isBlacklisted,
};
