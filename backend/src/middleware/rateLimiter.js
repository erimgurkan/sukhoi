const rateLimit = require('express-rate-limit');
const config = require('../config');

// General API Rate Limiter
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter Wallet Creation Limiter (max 5 wallets per IP per hour)
const walletCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 9999,
  message: {
    success: false,
    message: 'Wallet creation limit exceeded. Maximum 5 wallets per hour per IP.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  walletCreateLimiter
};
