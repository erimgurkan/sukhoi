const express = require('express');
const router = express.Router();
const walletService = require('../services/wallet');
const blockchainService = require('../services/blockchain');
const { validateAddress } = require('../middleware/validator');
const { walletCreateLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

// POST /api/wallet/create - Create HD wallet
router.post('/create', walletCreateLimiter, async (req, res) => {
  try {
    const { address, mnemonic } = await walletService.createWallet();
    res.status(201).json({
      success: true,
      address,
      mnemonic // returned once to the client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create wallet'
    });
  }
});

// POST /api/wallet/recover - Recover wallet from mnemonic
router.post('/recover', async (req, res) => {
  const { mnemonic } = req.body;
  if (!mnemonic || typeof mnemonic !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Mnemonic phrase is required'
    });
  }
  
  try {
    const { address } = await walletService.recoverWallet(mnemonic);
    res.status(200).json({
      success: true,
      address
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/wallet/:address - Get address details (balance and TX history)
router.get('/:address', validateAddress, async (req, res) => {
  const { address } = req.params;
  try {
    if (await walletService.isBanned(address)) {
      return res.status(403).json({ success: false, message: 'This wallet is banned from the network.' });
    }

    // Check checksum and register address if not registered
    await walletService.registerAddress(address);
    
    const balance = await blockchainService.getBalance(address);
    const transactions = await blockchainService.getTransactionHistory(address);
    
    res.status(200).json({
      success: true,
      address,
      balance,
      transactions
    });
  } catch (error) {
    logger.error(`Error loading details for wallet ${address}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to load wallet details'
    });
  }
});

module.exports = router;
