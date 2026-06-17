const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  address: { 
    type: String, 
    required: true, 
    unique: true 
  },
  isBanned: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Wallet', walletSchema);
