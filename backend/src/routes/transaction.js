const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchain');
const { validateTransaction } = require('../middleware/validator');
const logger = require('../utils/logger');

// POST /api/tx/send - Broadcast a signed transaction
router.post('/send', validateTransaction, async (req, res) => {
  const { signedTransaction } = req.body;
  try {
    const txHash = await blockchainService.sendSignedTransaction(signedTransaction);
    logger.info('Broadcasted signed transaction', { txHash });
    
    res.status(200).json({
      success: true,
      txHash
    });
  } catch (error) {
    logger.error('Failed to broadcast transaction:', error);
    res.status(400).json({
      success: false,
      message: 'Transaction broadcasting failed',
      error: error.message
    });
  }
});

// GET /api/tx/:hash - Get transaction details and receipt
router.get('/:hash', async (req, res) => {
  const { hash } = req.params;
  
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid transaction hash format'
    });
  }

  try {
    const transaction = await blockchainService.getTransaction(hash);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const receipt = await blockchainService.getTransactionReceipt(hash);

    res.status(200).json({
      success: true,
      transaction,
      receipt
    });
  } catch (error) {
    logger.error(`Error loading transaction details for ${hash}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction details'
    });
  }
});

module.exports = router;
