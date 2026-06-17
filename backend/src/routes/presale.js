const express = require('express');
const router = express.Router();
const presaleService = require('../services/presale');
const logger = require('../utils/logger');

router.post('/contribute', (req, res, next) => {
  try {
    const { address, amountUSDT, paymentToken, txProofMessage } = req.body;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    if (!amountUSDT || isNaN(amountUSDT) || parseFloat(amountUSDT) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    const request = presaleService.submitRequest(
      address,
      amountUSDT,
      paymentToken,
      txProofMessage
    );

    res.status(201).json({
      success: true,
      request
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
