const { WebSocketServer, WebSocket } = require('ws');
const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  init(server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    logger.info('WebSocket Server initialized on /ws path');

    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      logger.info(`New WebSocket connection established from IP: ${clientIp}`);
      
      this.clients.add(ws);
      ws.isAlive = true;

      // Send connection welcome status
      ws.send(JSON.stringify({
        type: 'connected',
        data: {
          clientCount: this.clients.size
        },
        timestamp: Date.now()
      }));

      // Listen for pong messages (heartbeat check)
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle connection close
      ws.on('close', () => {
        this.clients.delete(ws);
        logger.info(`WebSocket connection closed. Active clients: ${this.clients.size}`);
      });

      // Handle errors
      ws.on('error', (err) => {
        logger.error(`WebSocket connection error from IP ${clientIp}:`, err);
        this.clients.delete(ws);
        ws.terminate();
      });
    });

    // Setup heartbeat check interval (every 30 seconds)
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          logger.warn('WebSocket connection timed out. Terminating client...');
          this.clients.delete(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  broadcast(type, data) {
    if (!this.wss) return;
    
    const payload = JSON.stringify({
      type,
      data,
      timestamp: Date.now()
    });

    let count = 0;
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        count++;
      }
    });
    
    logger.debug(`Broadcasted message of type '${type}' to ${count} clients.`);
  }

  broadcastBlock(block) {
    this.broadcast('new_block', {
      number: block.number,
      hash: block.hash,
      timestamp: block.timestamp * 1000,
      transactionCount: block.transactions.length,
      gasUsed: block.gasUsed.toString(),
      miner: block.miner
    });
  }

  broadcastTransaction(tx) {
    this.broadcast('new_transaction', {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      blockNumber: tx.blockNumber,
      timestamp: tx.timestamp,
      message: tx.message,
      fee: tx.fee
    });
  }

  broadcastNetworkStatus(status) {
    this.broadcast('network_status', status);
  }

  getClientCount() {
    return this.clients.size;
  }
}

module.exports = new WebSocketService();
