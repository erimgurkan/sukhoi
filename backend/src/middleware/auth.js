const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    logger.warn('Auth failed: No Authorization header provided');
    return res.status(401).json({ success: false, message: 'Authorization header required' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn('Auth failed: Token format must be Bearer <token>');
    return res.status(401).json({ success: false, message: 'Format must be: Bearer <token>' });
  }

  const token = parts[1];

  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      logger.warn('Auth failed: Invalid or expired JWT token', { error: err.message });
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }

    req.admin = {
      username: decoded.username
    };
    next();
  });
};
