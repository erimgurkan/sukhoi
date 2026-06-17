const { body, param, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

// Validations
const validateAddress = [
  param('address')
    .isString()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address format'),
  handleValidationErrors
];

const validateTransaction = [
  body('signedTransaction')
    .isString()
    .notEmpty()
    .withMessage('signedTransaction string is required'),
  handleValidationErrors
];

const validateMint = [
  body('to')
    .isString()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid recipient address format'),
  body('amount')
    .isString()
    .notEmpty()
    .matches(/^\d+(\.\d+)?$/)
    .withMessage('Amount must be a positive number string'),
  handleValidationErrors
];

const validateLogin = [
  body('username')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .isString()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

module.exports = {
  validateAddress,
  validateTransaction,
  validateMint,
  validateLogin
};
