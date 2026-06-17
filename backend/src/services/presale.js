const logger = require('../utils/logger');
const blockchainService = require('./blockchain');
const websocketService = require('./websocket');

class PresaleService {
  constructor() {
    this.requests = [];
    this.nextId = 1;
  }

  submitRequest(address, amountUSDT, paymentToken, txProofMessage) {
    const amountSKH = (parseFloat(amountUSDT) / 2500).toFixed(4);
    const request = {
      id: this.nextId++,
      address: address.toLowerCase(),
      amountUSDT: parseFloat(amountUSDT).toString(),
      amountSKH: amountSKH,
      paymentToken: paymentToken || 'USDT',
      txProofMessage: txProofMessage || '',
      timestamp: Date.now(),
      status: 'pending', // 'pending', 'approved', 'rejected'
      txHash: null
    };

    this.requests.unshift(request); // Newest requests first
    logger.info('Presale purchase request submitted', { request });

    // Notify WebSocket clients (e.g. admin panel) of a new pending request
    websocketService.broadcast('presale_request_new', request);

    return request;
  }

  getRequests() {
    return this.requests;
  }

  async approveRequest(id) {
    const request = this.requests.find(r => r.id === parseInt(id, 10));
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error(`Request is already ${request.status}`);
    }

    logger.info('Approving presale request', { id: request.id, address: request.address, amount: request.amountSKH });

    // Execute the minting on-chain to the user's address
    const txHash = await blockchainService.mintTokens(request.address, request.amountSKH);

    request.status = 'approved';
    request.txHash = txHash;

    logger.info('Presale request approved and tokens minted', { id: request.id, txHash });

    // Notify clients of the update
    websocketService.broadcast('presale_request_updated', request);

    return request;
  }

  rejectRequest(id) {
    const request = this.requests.find(r => r.id === parseInt(id, 10));
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error(`Request is already ${request.status}`);
    }

    request.status = 'rejected';
    logger.info('Presale request rejected', { id: request.id });

    // Notify clients of the update
    websocketService.broadcast('presale_request_updated', request);

    return request;
  }
}

module.exports = new PresaleService();
