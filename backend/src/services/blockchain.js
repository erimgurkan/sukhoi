const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    // For WS provider, check if WS URL is working
    try {
      this.wsProvider = new ethers.WebSocketProvider(config.blockchain.wsUrl);
    } catch (e) {
      logger.warn('Could not establish WebSocket provider connection, falling back to HTTP polling.', { error: e.message });
      this.wsProvider = null;
    }
    
    this.contract = null;
    this.contractWithSigner = null;
    this.contractAddress = null;
    this.abi = null;
  }

  async init() {
    const deploymentsPath = path.join(__dirname, '..', '..', '..', 'deployments.json');
    try {
      if (fs.existsSync(deploymentsPath)) {
        const deploymentData = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
        this.contractAddress = deploymentData.address;
        this.abi = deploymentData.abi;
        
        // Setup read-only contract
        this.contract = new ethers.Contract(this.contractAddress, this.abi, this.provider);
        
        // Setup read-write contract using Hardhat's default account 0 as signer
        try {
          const signer = await this.provider.getSigner(0);
          this.contractWithSigner = new ethers.Contract(this.contractAddress, this.abi, signer);
          logger.info(`BlockchainService initialized contract at ${this.contractAddress} with Admin Signer`);
        } catch (e) {
          logger.warn(`Could not get signer from provider. Read-only fallback.`, { error: e.message });
          this.contractWithSigner = this.contract;
        }
      } else {
        logger.warn(`deployments.json not found at ${deploymentsPath}. Contract operations will be unavailable until deployed.`);
      }
    } catch (error) {
      logger.error('Failed to initialize contract in BlockchainService:', error);
    }
  }

  async getBalance(address) {
    if (!this.contract) return '0.0';
    try {
      const balance = await this.contract.balanceOf(address);
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      logger.error(`Error fetching balance for ${address}:`, error);
      return '0.0';
    }
  }

  async getBlock(blockNumber) {
    try {
      // Get block with transactions details
      return await this.provider.getBlock(blockNumber, true);
    } catch (error) {
      logger.error(`Error fetching block ${blockNumber}:`, error);
      throw error;
    }
  }

  async getLatestBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      logger.error('Error fetching latest block number:', error);
      throw error;
    }
  }

  async getTransaction(txHash) {
    try {
      return await this.provider.getTransaction(txHash);
    } catch (error) {
      logger.error(`Error fetching transaction ${txHash}:`, error);
      throw error;
    }
  }

  async getTransactionReceipt(txHash) {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      logger.error(`Error fetching receipt for ${txHash}:`, error);
      throw error;
    }
  }

  async sendSignedTransaction(signedTx) {
    try {
      const tx = await this.provider.broadcastTransaction(signedTx);
      return tx.hash;
    } catch (error) {
      logger.error('Error sending signed transaction:', error);
      throw error;
    }
  }

  async mintTokens(to, amount) {
    if (!this.contractWithSigner) {
      throw new Error('Contract write interface unavailable. Check deployments.json or signer configuration.');
    }
    try {
      const parsedAmount = ethers.parseUnits(amount, 18);
      
      // Get the contract's own token balance (reserve balance)
      const reserveBalance = await this.contract.balanceOf(this.contractAddress);
      
      let tx;
      if (reserveBalance >= parsedAmount) {
        logger.info(`Reserve has balance. Withdrawing ${amount} SKH from reserve to ${to}`);
        tx = await this.contractWithSigner.withdrawReserve(to, parsedAmount);
      } else {
        logger.info(`Reserve empty. Transferring ${amount} SKH from Admin wallet to ${to}`);
        tx = await this.contractWithSigner.transfer(to, parsedAmount);
      }
      
      logger.info(`Distribution transaction submitted: ${tx.hash}`, { to, amount });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      logger.error('Error distributing tokens:', error);
      throw error;
    }
  }

  async getTokenInfo() {
    if (!this.contract) {
      return { name: 'Sukhoi', symbol: 'SKH', totalSupply: '0', contractAddress: 'None' };
    }
    try {
      const name = await this.contract.name();
      const symbol = await this.contract.symbol();
      const totalSupply = await this.contract.totalSupply();
      return {
        name,
        symbol,
        totalSupply: ethers.formatUnits(totalSupply, 18),
        contractAddress: this.contractAddress
      };
    } catch (error) {
      logger.error('Error fetching token info:', error);
      return { name: 'Sukhoi', symbol: 'SKH', totalSupply: '0', contractAddress: this.contractAddress };
    }
  }

  async getTransactionHistory(address) {
    try {
      const history = [];
      const currentBlock = await this.getLatestBlockNumber();
      const startBlock = Math.max(0, currentBlock - 100); // scan last 100 blocks
      
      // We can scan blockchain events for transfers involving the address
      if (this.contract) {
        // Query Transfer events where 'from' is address
        const sentFilter = this.contract.filters.Transfer(address, null);
        const sentEvents = await this.contract.queryFilter(sentFilter, startBlock, currentBlock);
        
        // Query Transfer events where 'to' is address
        const receivedFilter = this.contract.filters.Transfer(null, address);
        const receivedEvents = await this.contract.queryFilter(receivedFilter, startBlock, currentBlock);
        
        const allEvents = [...sentEvents, ...receivedEvents];
        // Sort events chronologically
        allEvents.sort((a, b) => a.blockNumber - b.blockNumber);
        
        for (const event of allEvents) {
          const block = await this.provider.getBlock(event.blockNumber);
          let message = '';
          let fee = '0';

          try {
            const tx = await this.provider.getTransaction(event.transactionHash);
            if (tx && tx.data && tx.data !== '0x') {
              const decoded = this.contract.interface.parseTransaction({ data: tx.data });
              if (decoded && decoded.name === 'sendWithMemo') {
                message = decoded.args[2];
                try {
                  const contractFee = await this.contract.messageFee();
                  fee = ethers.formatUnits(contractFee, 18);
                } catch (err) {
                  fee = '1.0';
                }
              }
            }
          } catch (e) {
            // Not a contract call with memo
          }

          history.push({
            hash: event.transactionHash,
            from: event.args[0],
            to: event.args[1],
            value: ethers.formatUnits(event.args[2], 18),
            blockNumber: event.blockNumber,
            timestamp: block ? block.timestamp * 1000 : Date.now(),
            message,
            fee
          });
        }
      }
      return history;
    } catch (error) {
      logger.error(`Error retrieving transaction history for ${address}:`, error);
      return [];
    }
  }

  subscribeToBlocks(callback) {
    const provider = this.wsProvider || this.provider;
    if (!provider) return;

    provider.on('block', async (blockNumber) => {
      try {
        const block = await this.getBlock(blockNumber);
        callback(block);
      } catch (e) {
        logger.error(`WebSocket subscription block fetch error for block ${blockNumber}:`, e);
      }
    });
    logger.info('Subscribed to block events');
  }

  subscribeToContractEvents(callback) {
    if (!this.contract) return;
    
    this.contract.on('Transfer', async (from, to, value, event) => {
      try {
        const block = await this.provider.getBlock(event.log.blockNumber);
        let message = '';
        let fee = '0';

        try {
          const tx = await this.provider.getTransaction(event.log.transactionHash);
          if (tx && tx.data && tx.data !== '0x') {
            const decoded = this.contract.interface.parseTransaction({ data: tx.data });
            if (decoded && decoded.name === 'sendWithMemo') {
              message = decoded.args[2];
              try {
                const contractFee = await this.contract.messageFee();
                fee = ethers.formatUnits(contractFee, 18);
              } catch (err) {
                fee = '1.0';
              }
            }
          }
        } catch (e) {
          // Not a contract call with memo
        }

        const txData = {
          hash: event.log.transactionHash,
          from,
          to,
          value: ethers.formatUnits(value, 18),
          blockNumber: event.log.blockNumber,
          timestamp: block ? block.timestamp * 1000 : Date.now(),
          message,
          fee
        };
        callback(txData);
      } catch (e) {
        logger.error('Error handling Transfer contract event:', e);
      }
    });
    logger.info('Subscribed to ERC20 contract Transfer events');
  }

  async pauseNetwork() {
    if (!this.contractWithSigner) throw new Error('Contract write interface unavailable.');
    try {
      const tx = await this.contractWithSigner.pause();
      logger.info(`Network pause requested: ${tx.hash}`);
      await tx.wait();
      return true;
    } catch (error) {
      logger.error('Error pausing network:', error);
      throw error;
    }
  }

  async unpauseNetwork() {
    if (!this.contractWithSigner) throw new Error('Contract write interface unavailable.');
    try {
      const tx = await this.contractWithSigner.unpause();
      logger.info(`Network unpause requested: ${tx.hash}`);
      await tx.wait();
      return true;
    } catch (error) {
      logger.error('Error unpausing network:', error);
      throw error;
    }
  }

  async isPaused() {
    if (!this.contract) return false;
    try {
      return await this.contract.paused();
    } catch (error) {
      logger.error('Error checking if network is paused:', error);
      return false;
    }
  }
}

module.exports = new BlockchainService();
