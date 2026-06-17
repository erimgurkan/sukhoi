import { useEffect, useState, useRef } from 'react';

export function useWebSocket() {
  const [blocks, setBlocks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [networkStatus, setNetworkStatus] = useState({ isPaused: false });
  const [isConnected, setIsConnected] = useState(false);
  const [clientCount, setClientCount] = useState(0);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (socketRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Admin WebSocket connection established.');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        if (type === 'connected') {
          setClientCount(data.clientCount);
        } else if (type === 'new_block') {
          // Prepend new block, keep last 100 blocks
          setBlocks((prev) => [data, ...prev].slice(0, 100));
          // If the new block contains transaction count, we can increment clientCount or track metrics
        } else if (type === 'new_transaction') {
          // Prepend new transaction, keep last 200 transactions
          setTransactions((prev) => [data, ...prev].slice(0, 200));
        } else if (type === 'network_status') {
          setNetworkStatus(data);
        }
      } catch (err) {
        console.error('Error parsing Admin WebSocket message:', err);
      }
    };

    socket.onclose = (event) => {
      socketRef.current = null;
      setIsConnected(false);
      console.log(`Admin WebSocket connection closed: ${event.reason || 'Normal close'}`);
      
      // Attempt reconnection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const timeout = Math.pow(2, reconnectAttemptsRef.current) * 1000;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, timeout);
      }
    };

    socket.onerror = (err) => {
      console.error('Admin WebSocket connection error:', err);
      socket.close();
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    blocks,
    transactions,
    networkStatus,
    isConnected,
    clientCount
  };
}
