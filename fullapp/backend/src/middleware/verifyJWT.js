const { verifyAccessToken } = require('../services/token.service');

module.exports = (req, res, next) => {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};
