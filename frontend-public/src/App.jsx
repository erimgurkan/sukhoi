import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useWallet } from './hooks/useWallet';
import { useWebSocket } from './hooks/useWebSocket';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Explorer } from './pages/Explorer';
import { ToastContainer } from './components/Toast';
import { loadConfig } from './config';

export default function App() {
  const location = useLocation();
  const wallet = useWallet();
  const [toasts, setToasts] = useState([]);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load contract address from backend config on mount
  useEffect(() => {
    loadConfig().then((data) => {
      if (data) {
        console.log('Backend configuration loaded successfully.', data);
      }
      setConfigLoaded(true);
    });
  }, []);

  // Handle incoming websocket transaction alerts
  const handleNewTransactionAlert = (tx) => {
    // Check if the transaction belongs to our wallet
    if (wallet.address && (
      tx.from.toLowerCase() === wallet.address.toLowerCase() ||
      tx.to.toLowerCase() === wallet.address.toLowerCase()
    )) {
      const isSent = tx.from.toLowerCase() === wallet.address.toLowerCase();
      const action = isSent ? 'sent' : 'received';
      const type = isSent ? 'warning' : 'success';
      const valStr = parseFloat(tx.value).toFixed(2);
      
      const newToast = {
        id: `tx-${tx.hash}-${Date.now()}`,
        message: `${valStr} SKH successfully ${action}! (Hash: ${tx.hash.substring(0, 10)}...)`,
        type,
        timestamp: Date.now()
      };
      
      setToasts((prev) => [newToast, ...prev]);
      wallet.refreshBalance();
    } else {
      // General transaction alert (not ours)
      const valStr = parseFloat(tx.value).toFixed(2);
      const truncate = (addr) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
      
      const newToast = {
        id: `general-${tx.hash}-${Date.now()}`,
        message: `New Transfer: ${truncate(tx.from)} ➔ ${truncate(tx.to)} (${valStr} SKH)`,
        type: 'info',
        timestamp: Date.now()
      };
      setToasts((prev) => [newToast, ...prev].slice(0, 10)); // keep last 10 toast logs max
    }
  };

  // Setup WS connection at app root
  const { messages, lastBlock, lastTransaction, isConnected } = useWebSocket(handleNewTransactionAlert);

  // Extract recent blocks from WebSocket messages list for explorer feed
  const liveBlocks = messages
    .filter((msg) => msg.type === 'new_block')
    .map((msg) => msg.data);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (!configLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>Initializing Sukhoi Chain...</div>
      </div>
    );
  }

  return (
    <>
      {/* Navigation Bar */}
      <nav className="nav">
        <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
          Sukhoi <span>Chain</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          
          {wallet.address && (
            <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              My Wallet
            </Link>
          )}

          <Link to="/explorer" className={`nav-link ${location.pathname === '/explorer' ? 'active' : ''}`}>
            Explorer
          </Link>
        </div>
      </nav>

      {/* Page Routing */}
      <Routes>
        <Route 
          path="/" 
          element={
            <Landing 
              address={wallet.address}
              balance={wallet.balance}
              refreshBalance={wallet.refreshBalance}
              createWallet={wallet.createWallet}
              recoverWallet={wallet.recoverWallet}
              mnemonic={wallet.mnemonic}
              latestBlock={lastBlock ? lastBlock.number : null}
              connectedClients={isConnected ? 1 : 0}
            />
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            wallet.address ? (
              <Dashboard wallet={wallet} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        <Route 
          path="/explorer" 
          element={
            <Explorer 
              blocks={liveBlocks} 
              isConnected={isConnected} 
            />
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Real-Time Toast Alerts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}
