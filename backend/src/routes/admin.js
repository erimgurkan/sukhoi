const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const authMiddleware = require('../middleware/auth');
const blockchainService = require('../services/blockchain');
const walletService = require('../services/wallet');
const websocketService = require('../services/websocket');
const { validateLogin, validateMint } = require('../middleware/validator');
const logger = require('../utils/logger');

// POST /api/admin/login - Authenticate admin and return JWT
router.post('/login', validateLogin, async (req, res) => {
  const { username, password } = req.body;
  
  try {
    if (username !== config.admin.username) {
      logger.warn('Admin login attempt failed: incorrect username', { username });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, config.admin.passwordHash);
    if (!isMatch) {
      logger.warn('Admin login attempt failed: incorrect password', { username });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Sign JWT token
    const token = jwt.sign(
      { username: config.admin.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info('Admin logged in successfully', { username });
    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
});

// Protect all routes below this middleware
router.use(authMiddleware);

// GET /api/admin/stats - Retrieve system and network statistics
router.get('/stats', async (req, res) => {
  try {
    const tokenInfo = await blockchainService.getTokenInfo();
    const latestBlock = await blockchainService.getLatestBlockNumber();
    const registeredWallets = await walletService.getRegisteredCount();
    const connectedClients = websocketService.getClientCount();
    const isPaused = await blockchainService.isPaused();

    res.status(200).json({
      success: true,
      stats: {
        tokenName: tokenInfo.name,
        tokenSymbol: tokenInfo.symbol,
        totalSupply: tokenInfo.totalSupply,
        contractAddress: tokenInfo.contractAddress,
        registeredWallets,
        latestBlock,
        connectedClients,
        isPaused
      }
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve stats' });
  }
});

// GET /api/admin/wallets - Retrieve all registered wallets with their balances
router.get('/wallets', async (req, res) => {
  try {
    const dbWallets = await walletService.getAllWallets();
    const wallets = [];
    
    for (const w of dbWallets) {
      const balance = await blockchainService.getBalance(w.address);
      wallets.push({
        address: w.address,
        isBanned: w.isBanned,
        createdAt: w.createdAt,
        balance
      });
    }

    res.status(200).json({
      success: true,
      wallets
    });
  } catch (error) {
    logger.error('Error fetching registered wallets:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve wallets list' });
  }
});

// POST /api/admin/wallets/:address/ban - Ban a wallet
router.post('/wallets/:address/ban', async (req, res) => {
  try {
    const success = await walletService.banWallet(req.params.address);
    if (!success) return res.status(404).json({ success: false, message: 'Wallet not found or DB error' });
    res.json({ success: true, message: 'Wallet banned successfully' });
  } catch (error) {
    logger.error('Error banning wallet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/wallets/:address/unban - Unban a wallet
router.post('/wallets/:address/unban', async (req, res) => {
  try {
    const success = await walletService.unbanWallet(req.params.address);
    if (!success) return res.status(404).json({ success: false, message: 'Wallet not found or DB error' });
    res.json({ success: true, message: 'Wallet unbanned successfully' });
  } catch (error) {
    logger.error('Error unbanning wallet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/admin/wallets/:address - Delete a wallet
router.delete('/wallets/:address', async (req, res) => {
  try {
    const success = await walletService.deleteWallet(req.params.address);
    if (!success) return res.status(404).json({ success: false, message: 'Wallet not found or DB error' });
    res.json({ success: true, message: 'Wallet deleted successfully' });
  } catch (error) {
    logger.error('Error deleting wallet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/blocks - Retrieve recent blocks history
router.get('/blocks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const latestBlock = await blockchainService.getLatestBlockNumber();
    
    let fromBlock = parseInt(req.query.from);
    if (isNaN(fromBlock)) {
      fromBlock = latestBlock;
    }

    const blocks = [];
    const endBlock = Math.max(0, fromBlock - limit + 1);

    for (let i = fromBlock; i >= endBlock; i--) {
      try {
        const block = await blockchainService.getBlock(i);
        blocks.push({
          number: block.number,
          hash: block.hash,
          parentHash: block.parentHash,
          timestamp: block.timestamp * 1000,
          transactionCount: block.transactions.length,
          transactions: block.transactions, // includes hash details
          gasUsed: block.gasUsed.toString(),
          gasLimit: block.gasLimit.toString(),
          miner: block.miner
        });
      } catch (err) {
        logger.warn(`Could not load block ${i} for history`, { error: err.message });
      }
    }

    res.status(200).json({
      success: true,
      blocks
    });
  } catch (error) {
    logger.error('Error fetching blocks history:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve blocks history' });
  }
});

// GET /api/admin/blocks/:number - Get specific block details
router.get('/blocks/:number', async (req, res) => {
  const blockNumber = parseInt(req.params.number);
  
  if (isNaN(blockNumber) || blockNumber < 0) {
    return res.status(400).json({ success: false, message: 'Invalid block number' });
  }

  try {
    const block = await blockchainService.getBlock(blockNumber);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }

    res.status(200).json({
      success: true,
      block: {
        number: block.number,
        hash: block.hash,
        parentHash: block.parentHash,
        timestamp: block.timestamp * 1000,
        transactions: block.transactions,
        gasUsed: block.gasUsed.toString(),
        gasLimit: block.gasLimit.toString(),
        miner: block.miner
      }
    });
  } catch (error) {
    logger.error(`Error loading block ${blockNumber}:`, error);
    res.status(500).json({ success: false, message: 'Failed to retrieve block details' });
  }
});

// POST /api/admin/mint - Mint SKH tokens to a target address
router.post('/mint', validateMint, async (req, res) => {
  const { to, amount } = req.body;
  try {
    const txHash = await blockchainService.mintTokens(to, amount);
    // Automatically register recipient address in the registry
    await walletService.registerAddress(to);
    
    res.status(200).json({
      success: true,
      message: `Successfully minted ${amount} SKH to ${to}`,
      txHash
    });
  } catch (error) {
    logger.error('Minting failed:', error);
    res.status(500).json({
      success: false,
      message: 'Token minting failed',
      error: error.message
    });
  }
});

// POST /api/admin/network/control - Pause or unpause the token transfers
router.post('/network/control', async (req, res) => {
  const { action } = req.body;
  
  if (action !== 'pause' && action !== 'unpause') {
    return res.status(400).json({ success: false, message: 'Action must be pause or unpause' });
  }

  try {
    let isPaused;
    if (action === 'pause') {
      await blockchainService.pauseNetwork();
      isPaused = true;
    } else {
      await blockchainService.unpauseNetwork();
      isPaused = false;
    }

    // Broadcast network status change to all WebSocket clients
    websocketService.broadcastNetworkStatus({ isPaused });

    res.status(200).json({
      success: true,
      isPaused
    });
  } catch (error) {
    logger.error(`Failed network control action ${action}:`, error);
    res.status(500).json({
      success: false,
      message: `Network control action '${action}' failed`,
      error: error.message
    });
  }
});

// Presale Request management
const presaleService = require('../services/presale');

// GET /api/admin/presale/requests - Retrieve all presale contribution requests
router.get('/presale/requests', async (req, res, next) => {
  try {
    const requests = presaleService.getRequests();
    res.json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/presale/approve/:id - Approve request and mint SKH on-chain
router.post('/presale/approve/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await presaleService.approveRequest(id);
    
    // Register recipient wallet address so it appears on the 3D map too
    await walletService.registerAddress(request.address);

    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/admin/presale/reject/:id - Reject a request
router.post('/presale/reject/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = presaleService.rejectRequest(id);
    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
