import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Blocks } from './pages/Blocks';
import { Wallets } from './pages/Wallets';
import { NetworkMap } from './pages/NetworkMap';

export default function App() {
  const { isAuthenticated, loading, login, logout } = useAuth();
  const location = useLocation();
  
  // Initialize WebSocket connection at app root
  const ws = useWebSocket();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>Admin Paneli yükleniyor...</div>
      </div>
    );
  }

  // If not authenticated, force routing to login page
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login login={login} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="admin-layout animate-in">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Sukhoi Chain</h1>
          <div className="subtitle">Tanrı Paneli (God Panel)</div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}>
            <span>■</span> Dashboard
          </Link>
          <Link to="/blocks" className={`sidebar-link ${location.pathname === '/blocks' ? 'active' : ''}`}>
            <span>◆</span> Blok Geçmişi
          </Link>
          <Link to="/wallets" className={`sidebar-link ${location.pathname === '/wallets' ? 'active' : ''}`}>
            <span>◉</span> Cüzdan Veritabanı
          </Link>
          <Link to="/network" className={`sidebar-link ${location.pathname === '/network' ? 'active' : ''}`}>
            <span>▲</span> Canlı Ağ Haritası
          </Link>
        </nav>

        {/* Logout Section */}
        <div style={{ padding: '0 20px' }}>
          <button 
            onClick={logout} 
            className="admin-btn admin-btn-danger" 
            style={{ width: '100%', padding: '8px', fontWeight: 600 }}
          >
            OTURUMU KAPAT
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <Routes>
        <Route 
          path="/" 
          element={
            <Dashboard 
              blocks={ws.blocks} 
              transactions={ws.transactions}
              networkStatus={ws.networkStatus}
              isConnected={ws.isConnected}
              clientCount={ws.clientCount}
            />
          } 
        />
        
        <Route 
          path="/blocks" 
          element={
            <Blocks wsBlocks={ws.blocks} />
          } 
        />
        
        <Route 
          path="/wallets" 
          element={
            <Wallets />
          } 
        />
        
        <Route 
          path="/network" 
          element={
            <NetworkMap wsTransactions={ws.transactions} />
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </div>
  );
}
