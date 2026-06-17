const { ethers } = require('ethers');
const logger = require('../utils/logger');
const Wallet = require('../db/models/Wallet');

class WalletService {
  constructor() {
    // Migration is no longer run synchronously in the constructor
  }

  async createWallet() {
    try {
      const wallet = ethers.Wallet.createRandom();
      const address = wallet.address;
      const mnemonic = wallet.mnemonic.phrase;

      await this.registerAddress(address);
      logger.info('New HD wallet created', { address });

      return { address, mnemonic };
    } catch (error) {
      logger.error('Error generating HD wallet:', error);
      throw new Error('Failed to generate wallet');
    }
  }

  async recoverWallet(mnemonic) {
    try {
      const cleanMnemonic = mnemonic.trim();
      const wallet = ethers.Wallet.fromPhrase(cleanMnemonic);
      const address = wallet.address;

      if (await this.isBanned(address)) {
         throw new Error('BANNED');
      }

      await this.registerAddress(address);
      logger.info('Wallet recovered from mnemonic phrase', { address });

      return { address };
    } catch (error) {
      logger.error('Error recovering wallet from mnemonic:', error.message);
      if (error.message === 'BANNED') throw new Error('This wallet is banned from the network.');
      throw new Error('Invalid mnemonic phrase');
    }
  }

  async isRegistered(address) {
    try {
      const checksumAddress = ethers.getAddress(address);
      const wallet = await Wallet.findOne({ address: checksumAddress });
      return !!wallet;
    } catch (e) {
      logger.error('DB Error checking registration:', e);
      return false;
    }
  }

  async registerAddress(address) {
    try {
      const checksumAddress = ethers.getAddress(address);
      const existing = await Wallet.findOne({ address: checksumAddress });
      if (!existing) {
        await Wallet.create({ address: checksumAddress });
      }
      return true;
    } catch (error) {
      logger.error(`Failed to register address ${address}:`, error);
      return false;
    }
  }

  async isBanned(address) {
    try {
      const checksumAddress = ethers.getAddress(address);
      const wallet = await Wallet.findOne({ address: checksumAddress });
      return wallet ? wallet.isBanned : false;
    } catch (e) {
      logger.error('DB Error checking ban status:', e);
      return false;
    }
  }

  async banWallet(address) {
    try {
      const checksumAddress = ethers.getAddress(address);
      const res = await Wallet.updateOne({ address: checksumAddress }, { isBanned: true });
      return res.modifiedCount > 0 || res.matchedCount > 0;
    } catch (e) {
      logger.error('DB Error banning wallet:', e);
      return false;
    }
  }

  async unbanWallet(address) {
    try {
      const checksumAddress = ethers.getAddress(address);
      const res = await Wallet.updateOne({ address: checksumAddress }, { isBanned: false });
      return res.modifiedCount > 0 || res.matchedCount > 0;
    } catch (e) {
      logger.error('DB Error unbanning wallet:', e);
      return false;
    }
  }

  async deleteWallet(address) {
    try {
      const checksumAddress = ethers.getAddress(address);
      const res = await Wallet.deleteOne({ address: checksumAddress });
      return res.deletedCount > 0;
    } catch (e) {
      logger.error('DB Error deleting wallet:', e);
      return false;
    }
  }

  async getRegisteredAddresses() {
    try {
      const wallets = await Wallet.find({}, 'address');
      return wallets.map(w => w.address);
    } catch (e) {
      logger.error('DB Error getting registered addresses:', e);
      return [];
    }
  }

  async getAllWallets() {
    try {
      return await Wallet.find().sort({ createdAt: -1 });
    } catch (e) {
      logger.error('DB Error getting all wallets:', e);
      return [];
    }
  }

  async getRegisteredCount() {
    try {
      return await Wallet.countDocuments();
    } catch (e) {
      logger.error('DB Error getting count:', e);
      return 0;
    }
  }
}

module.exports = new WalletService();
