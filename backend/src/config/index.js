const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

module.exports = {
  port: process.env.PORT || 3001,
  blockchain: {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
    wsUrl: process.env.BLOCKCHAIN_WS_URL || 'ws://127.0.0.1:8545'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'sukhoi-default-secret-key-2024',
    expiresIn: '24h'
  },
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    passwordHash: process.env.ADMIN_PASSWORD_HASH || '$2a$12$LJ3m4ys3GzWnVxYHqSQpxeR3lQKjS7GkfPM3B3iU5xCQhGjGPkXy6'
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(',')
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sukhoi_chain'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 mins
    max: parseInt(process.env.RATE_LIMIT_MAX) || 5000,
    walletCreateLimit: parseInt(process.env.WALLET_CREATE_LIMIT) || 5
  },
  logLevel: process.env.LOG_LEVEL || 'info'
};
