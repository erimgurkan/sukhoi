import React, { useState, useEffect } from 'react';
import { StatsCards } from '../components/StatsCards';
import { NetworkCanvas } from '../components/NetworkCanvas';
import * as api from '../services/api';

export function Dashboard({ blocks, transactions, networkStatus, isConnected, clientCount }) {
  const [stats, setStats] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [mintAddress, setMintAddress] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintLoading, setMintLoading] = useState(false);
  const [mintFeedback, setMintFeedback] = useState(null);
  const [controlLoading, setControlLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestsFeedback, setRequestsFeedback] = useState(null);
  
  // Quick Send (selected node on map) states
  const [selectedNode, setSelectedNode] = useState(null);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState(null);

  // Fetch admin metrics from API
  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // Fetch wallets database for the 3D network visualizer
  const fetchWallets = async () => {
    try {
      const data = await api.getWallets();
      if (data.success) {
        setWallets(data.wallets);
      }
    } catch (err) {
      console.error('Failed to load wallets:', err);
    }
  };

  // Handle Quick Minting from Map node selection
  const handleQuickMint = async (e) => {
    e.preventDefault();
    if (!selectedNode) return;
    setQuickLoading(true);
    setQuickFeedback(null);

    const targetAddress = selectedNode.address;
    if (!/^0x[a-fA-F0-9]{40}$/.test(targetAddress)) {
      setQuickFeedback({ type: 'error', message: 'Geçersiz adres formatı.' });
      setQuickLoading(false);
      return;
    }

    if (isNaN(quickAmount) || parseFloat(quickAmount) <= 0) {
      setQuickFeedback({ type: 'error', message: 'Miktar pozitif sayı olmalıdır.' });
      setQuickLoading(false);
      return;
    }

    try {
      const data = await api.mintTokens(targetAddress, quickAmount.trim());
      if (data.success) {
        setQuickFeedback({ type: 'success', message: `${quickAmount} SKH adrese başarıyla basıldı.` });
        setQuickAmount('');
        await fetchStats();
        await fetchWallets();
        
        // Update selected node balance view locally
        setSelectedNode(prev => {
          if (!prev) return null;
          const currentBal = parseFloat(prev.balance) || 0;
          const added = parseFloat(quickAmount) || 0;
          return {
            ...prev,
            balance: (currentBal + added).toFixed(2)
          };
        });
      }
    } catch (err) {
      setQuickFeedback({ type: 'error', message: err.message || 'Token gönderme işlemi başarısız.' });
    } finally {
      setQuickLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await api.getPresaleRequests();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to load presale requests:', err);
    }
  };

  const handleApproveRequest = async (id) => {
    setRequestsFeedback(null);
    try {
      const data = await api.approvePresaleRequest(id);
      if (data.success) {
        setRequestsFeedback({ type: 'success', message: `Talep #${id} onaylandı ve SKH on-chain olarak gönderildi!` });
        await fetchRequests();
        await fetchStats();
        await fetchWallets();
      }
    } catch (err) {
      setRequestsFeedback({ type: 'error', message: err.message || `Onaylama işlemi başarısız.` });
    }
  };

  const handleRejectRequest = async (id) => {
    setRequestsFeedback(null);
    try {
      const data = await api.rejectPresaleRequest(id);
      if (data.success) {
        setRequestsFeedback({ type: 'success', message: `Talep #${id} reddedildi.` });
        await fetchRequests();
      }
    } catch (err) {
      setRequestsFeedback({ type: 'error', message: err.message || `Reddetme işlemi başarısız.` });
    }
  };

  useEffect(() => {
    fetchStats();
    fetchWallets();
    fetchRequests();
    // Poll data periodically
    const interval = setInterval(() => {
      fetchStats();
      fetchWallets();
      fetchRequests();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update stats dynamically when blocks updates from WS
  useEffect(() => {
    if (blocks.length > 0 && stats) {
      setStats((prev) => ({
        ...prev,
        latestBlock: blocks[0].number
      }));
      fetchWallets(); // refresh wallet balances on new blocks
    }
  }, [blocks]);

  // Update stats dynamically when WS client count changes
  useEffect(() => {
    if (stats) {
      setStats((prev) => ({
        ...prev,
        connectedClients: clientCount
      }));
    }
  }, [clientCount]);

  // Handle Token Minting
  const handleMint = async (e) => {
    e.preventDefault();
    setMintLoading(true);
    setMintFeedback(null);

    if (!/^0x[a-fA-F0-9]{40}$/.test(mintAddress.trim())) {
      setMintFeedback({ type: 'error', message: 'Geçersiz adres formatı.' });
      setMintLoading(false);
      return;
    }

    if (isNaN(mintAmount) || parseFloat(mintAmount) <= 0) {
      setMintFeedback({ type: 'error', message: 'Miktar pozitif sayı olmalıdır.' });
      setMintLoading(false);
      return;
    }

    try {
      const data = await api.mintTokens(mintAddress.trim(), mintAmount.trim());
      if (data.success) {
        setMintFeedback({ type: 'success', message: `${mintAmount} SKH adrese başarıyla basıldı.` });
        setMintAddress('');
        setMintAmount('');
        fetchStats(); // reload supply metrics
      }
    } catch (err) {
      setMintFeedback({ type: 'error', message: err.message || 'Token basma işlemi başarısız.' });
    } finally {
      setMintLoading(false);
    }
  };

  // Handle network control (pause/unpause)
  const handleNetworkControl = async () => {
    if (!stats) return;
    setControlLoading(true);
    const action = stats.isPaused ? 'unpause' : 'pause';
    try {
      const data = await api.controlNetwork(action);
      if (data.success) {
        setStats(prev => ({
          ...prev,
          isPaused: data.isPaused
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setControlLoading(false);
    }
  };

  const handleBanWallet = async (address) => {
    if (!window.confirm(`${address} adresli cüzdanı banlamak istediğinize emin misiniz?`)) return;
    try {
      const data = await api.banWallet(address);
      if (data.success) {
        await fetchWallets();
      }
    } catch (err) {
      alert(err.message || 'Banlama başarısız oldu.');
    }
  };

  const handleUnbanWallet = async (address) => {
    try {
      const data = await api.unbanWallet(address);
      if (data.success) {
        await fetchWallets();
      }
    } catch (err) {
      alert(err.message || 'Ban kaldırma başarısız oldu.');
    }
  };

  const handleDeleteWallet = async (address) => {
    if (!window.confirm(`DİKKAT: ${address} adresli cüzdan sistemden tamamen silinecek. Emin misiniz?`)) return;
    try {
      const data = await api.deleteWallet(address);
      if (data.success) {
        await fetchWallets();
        await fetchStats();
      }
    } catch (err) {
      alert(err.message || 'Silme başarısız oldu.');
    }
  };

  const truncateHash = (hash) => `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700 }}>Ağ Yönetim Paneli</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
          <span style={{ color: isConnected ? 'var(--success)' : 'var(--error)' }}>
            {isConnected ? 'AĞ DÜĞÜMÜ BAĞLI' : 'RPC BAĞLANTISI KESİLDİ'}
          </span>
        </div>
      </div>

      {/* Grid Stats Cards */}
      <StatsCards stats={stats} />

      {/* Centerpiece 3D Network Visualizer & Quick Send Panel */}
      <div className="panel animate-in" style={{ marginTop: '24px' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Canlı Ağ Haritası (3D)</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {selectedNode ? 'Düğüm Seçildi — Hızlı Transfer Açık' : 'Hızlı transfer için haritadan bir cüzdana tıklayın'}
          </span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '1fr 340px' : '1fr', transition: 'all 0.3s ease' }}>
            
            <NetworkCanvas 
              wallets={wallets} 
              transactions={transactions} 
              onNodeSelected={(node) => setSelectedNode(node)} 
            />

            {selectedNode && (
              <div 
                style={{ 
                  borderLeft: '1px solid var(--border)', 
                  padding: '24px', 
                  background: 'var(--bg-secondary)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  animation: 'fadeIn 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    HIZLI MİNT (TRANSFER)
                  </h4>
                  <button 
                    onClick={() => { setSelectedNode(null); setQuickFeedback(null); }} 
                    className="admin-btn admin-btn-sm"
                    style={{ fontSize: '0.65rem', padding: '2px 8px' }}
                  >
                    Kapat
                  </button>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    ALICI ADRESİ
                  </span>
                  <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-primary)', wordBreak: 'break-all', background: 'var(--bg-primary)', padding: '8px', border: '1px solid var(--border)' }}>
                    {selectedNode.address}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    ANLIK BAKİYE
                  </span>
                  <div className="mono" style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 'bold' }}>
                    {selectedNode.balance} SKH
                  </div>
                </div>

                <form onSubmit={handleQuickMint} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      GÖNDERİLECEK MİKTAR (SKH)
                    </label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      placeholder="Miktar girin..." 
                      value={quickAmount}
                      onChange={(e) => setQuickAmount(e.target.value)}
                      required
                      disabled={quickLoading}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="admin-btn admin-btn-primary" 
                    style={{ width: '100%', padding: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}
                    disabled={quickLoading || !quickAmount}
                  >
                    {quickLoading ? 'Gönderiliyor...' : 'TOKEN GÖNDER'}
                  </button>
                </form>

                {quickFeedback && (
                  <div 
                    style={{ 
                      padding: '8px 12px', 
                      fontSize: '0.75rem',
                      background: quickFeedback.type === 'error' ? 'var(--error-dim)' : 'var(--success-dim)',
                      border: `1px solid ${quickFeedback.type === 'error' ? 'var(--error)' : 'var(--success)'}`,
                      color: quickFeedback.type === 'error' ? 'var(--error)' : 'var(--success)',
                      wordBreak: 'break-all'
                    }}
                  >
                    {quickFeedback.message}
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </div>

      {/* Presale Contribution Tickets Panel */}
      <div className="panel animate-in" style={{ marginTop: '24px' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Ön Satış USDT Katılım Talepleri</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Kullanıcıların manuel USDT/ETH transfer bildirimleri. Onayladığınızda cüzdanlarına otomatik on-chain token basılır.
          </span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          
          {requestsFeedback && (
            <div 
              style={{ 
                margin: '16px',
                padding: '10px 16px', 
                fontSize: '0.85rem',
                background: requestsFeedback.type === 'error' ? 'var(--error-dim)' : 'var(--success-dim)',
                border: `1px solid ${requestsFeedback.type === 'error' ? 'var(--error)' : 'var(--success)'}`,
                color: requestsFeedback.type === 'error' ? 'var(--error)' : 'var(--success)',
              }}
            >
              {requestsFeedback.message}
            </div>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Talep ID</th>
                <th>Cüzdan Adresi</th>
                <th>Katılım Miktarı</th>
                <th>Basılacak Varlık</th>
                <th>Ödeme Kanıtı / Mesaj</th>
                <th>Tarih</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className="mono" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>#{req.id}</td>
                  <td className="mono" style={{ fontSize: '0.8rem' }}>{req.address}</td>
                  <td className="mono" style={{ fontWeight: 'bold' }}>{req.amountUSDT} {req.paymentToken}</td>
                  <td className="mono" style={{ color: 'var(--success)', fontWeight: 'bold' }}>{req.amountSKH} SKH</td>
                  <td style={{ fontSize: '0.85rem', color: '#FFFFFF', fontStyle: 'italic' }}>
                    "{req.txProofMessage}"
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(req.timestamp).toLocaleString()}
                  </td>
                  <td>
                    {req.status === 'pending' && <span className="badge badge-warning" style={{ background: 'rgba(255, 193, 7, 0.08)', color: 'var(--warning)', borderColor: 'rgba(255, 193, 7, 0.2)' }}>Bekliyor</span>}
                    {req.status === 'approved' && <span className="badge badge-success">Onaylandı</span>}
                    {req.status === 'rejected' && <span className="badge badge-error">Reddedildi</span>}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    {req.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleApproveRequest(req.id)}
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Onayla (Mint)
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(req.id)}
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Reddet
                        </button>
                      </div>
                    ) : req.txHash ? (
                      <a 
                        href={`http://localhost:5173/explorer?tx=${req.txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'underline' }}
                      >
                        Blok İşlemi ({truncateHash(req.txHash)})
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>---</span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Henüz hiçbir ön satış katılım bildirimi bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

        </div>
      </div>

      {/* Control Actions & Mint Form */}
      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        
        {/* Network Control Panel */}
        <div className="panel animate-in">
          <div className="panel-header">Ağ Kontrol Mekanizması</div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Acil durumlarda akıllı sözleşme üzerindeki transfer işlevlerini dondurabilirsiniz. Ağ dondurulduğunda mint işlemleri hariç tüm SKH token transferleri duraklatılır.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Ağ Transfer Durumu</span>
              <button 
                onClick={handleNetworkControl}
                className={`admin-btn ${stats?.isPaused ? 'admin-btn-primary' : 'admin-btn-danger'}`}
                disabled={controlLoading || !stats}
                style={{ padding: '8px 24px', fontWeight: 600 }}
              >
                {controlLoading ? 'Güncelleniyor...' : (stats?.isPaused ? 'AĞI ETKİNLEŞTİR' : 'AĞI DONDUR')}
              </button>
            </div>
          </div>
        </div>

        {/* Minting Form Panel */}
        <div className="panel animate-in">
          <div className="panel-header">SKH Token Üretimi (Mint)</div>
          <div className="panel-body">
            <form onSubmit={handleMint} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <input 
                  type="text" 
                  className="admin-input" 
                  placeholder="Hedef cüzdan adresi (0x...)" 
                  value={mintAddress}
                  onChange={(e) => setMintAddress(e.target.value)}
                  required
                  disabled={mintLoading}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="admin-input" 
                  placeholder="Miktar" 
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  required
                  disabled={mintLoading}
                  style={{ flex: 1 }}
                />
                <button 
                  type="submit" 
                  className="admin-btn admin-btn-primary"
                  disabled={mintLoading || !mintAddress || !mintAmount}
                >
                  {mintLoading ? 'Üretiliyor...' : 'TOKEN MINT ET'}
                </button>
              </div>

              {mintFeedback && (
                <div 
                  style={{ 
                    padding: '8px', 
                    fontSize: '0.8rem',
                    border: `1px solid ${mintFeedback.type === 'error' ? 'var(--error)' : 'var(--success)'}`,
                    background: mintFeedback.type === 'error' ? 'var(--error-dim)' : 'var(--success-dim)',
                    color: mintFeedback.type === 'error' ? 'var(--error)' : 'var(--success)'
                  }}
                >
                  {mintFeedback.message}
                </div>
              )}
            </form>
          </div>
        </div>

      </div>

      {/* Live Logs Section */}
      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        
        {/* Recent Blocks logs */}
        <div className="panel">
          <div className="panel-header">Son Üretilen Bloklar (WS)</div>
          <div className="panel-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Blok</th>
                  <th>Hash</th>
                  <th>TX Sayısı</th>
                  <th>Gaz Kullanımı</th>
                </tr>
              </thead>
              <tbody>
                {blocks.slice(0, 10).map((block) => (
                  <tr key={block.hash}>
                    <td className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>#{block.number}</td>
                    <td className="mono">{truncateHash(block.hash)}</td>
                    <td className="mono">{block.transactionCount || 0} tx</td>
                    <td className="mono">{parseInt(block.gasUsed || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {blocks.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                      Yeni blok akışı bekleniyor...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transaction logs */}
        <div className="panel">
          <div className="panel-header">Son İşlem Akışı (WS)</div>
          <div className="panel-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>İşlem Hash</th>
                  <th>Gönderici ➔ Alıcı</th>
                  <th>Değer (SKH)</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).flatMap((tx) => [
                  <tr key={tx.hash}>
                    <td className="mono" style={{ color: 'var(--accent)' }}>{truncateHash(tx.hash)}</td>
                    <td className="mono" style={{ fontSize: '0.75rem' }}>
                      {truncateHash(tx.from)} ➔ {truncateHash(tx.to)}
                    </td>
                    <td className="mono" style={{ color: 'var(--success)', fontWeight: 600 }}>
                      {parseFloat(tx.value).toFixed(2)} SKH
                    </td>
                  </tr>,
                  tx.message && (
                    <tr key={`${tx.hash}-memo`} style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <td colSpan={3} style={{ padding: '6px 16px 10px 16px', fontSize: '0.8rem', borderTop: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Mesaj:</span>
                          <span style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>"{tx.message}"</span>
                          {tx.fee && parseFloat(tx.fee) > 0 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: 'auto' }}>
                              🔥 Fee: {tx.fee} SKH (Yakıldı)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                ].filter(Boolean))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                      Aktif işlem akışı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Wallet Management Panel */}
      <div className="panel animate-in" style={{ marginTop: '24px' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Cüzdan ve Kullanıcı Yönetimi</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Sistemde kayıtlı cüzdanları banlayabilir veya silebilirsiniz. Banlı cüzdanlar ağa bağlanamaz.
          </span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cüzdan Adresi</th>
                <th>Bakiye (SKH)</th>
                <th>Kayıt Tarihi</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet) => (
                <tr key={wallet.address} style={{ opacity: wallet.isBanned ? 0.5 : 1 }}>
                  <td className="mono" style={{ fontSize: '0.8rem' }}>{wallet.address}</td>
                  <td className="mono" style={{ color: 'var(--success)', fontWeight: 'bold' }}>{parseFloat(wallet.balance).toFixed(2)}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {wallet.createdAt ? new Date(wallet.createdAt).toLocaleString() : 'Eski Kayıt'}
                  </td>
                  <td>
                    {wallet.isBanned ? (
                      <span className="badge badge-error">Banlandı</span>
                    ) : (
                      <span className="badge badge-success">Aktif</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {wallet.isBanned ? (
                        <button 
                          onClick={() => handleUnbanWallet(wallet.address)}
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Ban Kaldır
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleBanWallet(wallet.address)}
                          className="admin-btn admin-btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'var(--warning)', color: '#000' }}
                        >
                          Banla
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteWallet(wallet.address)}
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {wallets.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Henüz kayıtlı cüzdan bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
