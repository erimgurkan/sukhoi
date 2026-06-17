const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('./middleware/helmet');
const config = require('./config');
const { generalLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

// Route imports
const walletRoutes = require('./routes/wallet');
const txRoutes = require('./routes/transaction');
const adminRoutes = require('./routes/admin');
const presaleRoutes = require('./routes/presale');

// Service imports
const blockchainService = require('./services/blockchain');
const websocketService = require('./services/websocket');

// Initialize Express
const app = express();

// Security and utility middleware
app.use(helmet);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (config.cors.origins.indexOf(origin) !== -1 || config.cors.origins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Max payload size 10kb
app.use(generalLimiter); // Apply general rate limiting

// API Routes
app.use('/api/wallet', walletRoutes);
app.use('/api/tx', txRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/presale', presaleRoutes);

// GET /api/health - Public health status check
app.get('/api/health', async (req, res) => {
  const isPaused = await blockchainService.isPaused();
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    contractAddress: blockchainService.contractAddress,
    isPaused
  });
});

// Centralized error handler middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled request error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: 'An internal server error occurred.'
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize services
async function startServer() {
  try {
    // 1. Initialize WebSocket Server
    websocketService.init(server);

    // 2. Initialize Blockchain Service
    await blockchainService.init();

    // 3. Subscribe to new blocks and broadcast them
    blockchainService.subscribeToBlocks((block) => {
      logger.info(`New block mined: #${block.number}`, { hash: block.hash, txCount: block.transactions.length });
      websocketService.broadcastBlock(block);
    });

    // 4. Subscribe to ERC20 Transfers and broadcast them
    blockchainService.subscribeToContractEvents((txData) => {
      logger.info(`New Transfer detected: ${txData.from} -> ${txData.to} (${txData.value} SKH)`);
      websocketService.broadcastTransaction(txData);
    });

    // 5. Start HTTP server
    server.listen(config.port, () => {
      logger.info(`Sukhoi Backend API & WebSocket Server running on port ${config.port}`);
    });

  } catch (error) {
    logger.error('Failed to start Sukhoi Backend Server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Shutting down backend server gracefully...');
  server.close(() => {
    logger.info('HTTP and WebSocket server closed.');
    process.exit(0);
  });
  
  // Force close after 10 seconds if graceful close fails
  setTimeout(() => {
    logger.warn('Forcing backend shutdown...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start
startServer();
