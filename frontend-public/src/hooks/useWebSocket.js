import { useEffect, useState, useRef } from 'react';

export function useWebSocket(onTransactionReceived) {
  const [messages, setMessages] = useState([]);
  const [lastBlock, setLastBlock] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (socketRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = 'wss://sukhoi.onrender.com/ws';
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established.');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data, timestamp } = payload;
        
        const messageWithTimestamp = { ...payload, id: `${type}-${timestamp}-${Math.random()}` };

        // Keep last 50 messages in state
        setMessages((prev) => [messageWithTimestamp, ...prev].slice(0, 50));

        if (type === 'new_block') {
          setLastBlock(data);
        } else if (type === 'new_transaction') {
          setLastTransaction(data);
          if (onTransactionReceived) {
            onTransactionReceived(data);
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socket.onclose = (event) => {
      socketRef.current = null;
      setIsConnected(false);
      console.log(`WebSocket connection closed: ${event.reason || 'Normal close'}`);
      
      // Attempt reconnection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const timeout = Math.pow(2, reconnectAttemptsRef.current) * 1000;
        console.log(`Reconnecting in ${timeout}ms (Attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, timeout);
      } else {
        console.warn('Max WebSocket reconnection attempts reached.');
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket connection error:', err);
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
    messages,
    lastBlock,
    lastTransaction,
    isConnected
  };
}
