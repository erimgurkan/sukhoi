import React, { useState } from 'react';
import * as api from '../services/api';

export function WalletTable({ wallets, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);

  // Quick Send States
  const [sendTargetWallet, setSendTargetWallet] = useState(null);
  const [sendAmount, setSendAmount] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendFeedback, setSendFeedback] = useState(null);

  const handleCopy = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter wallets by search query
  const filteredWallets = wallets.filter(wallet => 
    wallet.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort wallets by balance
  const sortedWallets = [...filteredWallets].sort((a, b) => {
    const balA = parseFloat(a.balance || 0);
    const balB = parseFloat(b.balance || 0);
    return sortAsc ? balA - balB : balB - balA;
  });

  const handleSendSubmit = async (e) => {
    e.preventDefault();
    if (!sendTargetWallet) return;
    setSendLoading(true);
    setSendFeedback(null);

    if (isNaN(sendAmount) || parseFloat(sendAmount) <= 0) {
      setSendFeedback({ type: 'error', message: 'Miktar pozitif bir sayı olmalıdır.' });
      setSendLoading(false);
      return;
    }

    try {
      const data = await api.mintTokens(sendTargetWallet.address, sendAmount.trim());
      if (data.success) {
        setSendFeedback({ type: 'success', message: `${sendAmount} SKH başarıyla gönderildi.` });
        setSendAmount('');
        // Wait 1.5s then close and refresh
        setTimeout(() => {
          setSendTargetWallet(null);
          setSendFeedback(null);
          if (onRefresh) onRefresh();
        }, 1500);
      }
    } catch (err) {
      setSendFeedback({ type: 'error', message: err.message || 'Gönderim başarısız.' });
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="panel animate-in">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <span>Kayıtlı Cüzdanlar ({wallets.length})</span>
        <input 
          type="text" 
          className="admin-input" 
          placeholder="Adrese göre filtrele..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '240px', padding: '4px 8px', fontSize: '0.75rem', height: '24px' }}
        />
      </div>

      <div className="panel-body" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cüzdan Adresi (Tıkla ve Kopyala)</th>
              <th 
                onClick={() => setSortAsc(!sortAsc)} 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                SKH Bakiye {sortAsc ? '▲' : '▼'}
              </th>
              <th style={{ textAlign: 'center' }}>Eylemler</th>
            </tr>
          </thead>
          <tbody>
            {sortedWallets.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  Arama kriterlerine uygun cüzdan bulunamadı.
                </td>
              </tr>
            ) : (
              sortedWallets.map((wallet) => (
                <tr key={wallet.address}>
                  <td 
                    className="mono" 
                    onClick={() => handleCopy(wallet.address)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>{wallet.address}</span>
                    {copiedAddress === wallet.address && (
                      <span 
                        style={{ 
                          marginLeft: '10px', 
                          fontSize: '0.65rem', 
                          color: 'var(--success)', 
                          background: 'var(--success-dim)', 
                          padding: '1px 4px', 
                          position: 'absolute' 
                        }}
                      >
                        KOPYALANDI
                      </span>
                    )}
                  </td>
                  <td className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {parseFloat(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} SKH
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px 16px' }}>
                    <button 
                      onClick={() => setSendTargetWallet(wallet)} 
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                    >
                      SKH Gönder
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog for Sending SKH */}
      {sendTargetWallet && (
        <div className="confirm-overlay" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="confirm-dialog" style={{ maxWidth: '440px', padding: '30px', background: 'var(--bg-secondary)', border: '2px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Cüzdana SKH Gönder (God Mode)
              </h3>
              <button 
                onClick={() => { setSendTargetWallet(null); setSendFeedback(null); }} 
                className="admin-btn admin-btn-sm" 
                style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                disabled={sendLoading}
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleSendSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Hedef Cüzdan
                </label>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-primary)', background: 'var(--bg-primary)', padding: '10px', border: '1px solid var(--border)', wordBreak: 'break-all' }}>
                  {sendTargetWallet.address}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Güncel Bakiye
                </label>
                <div className="mono" style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 'bold' }}>
                  {parseFloat(sendTargetWallet.balance).toFixed(2)} SKH
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Gönderilecek Miktar (SKH)
                </label>
                <input 
                  type="text" 
                  className="admin-input" 
                  placeholder="Gönderilecek miktar girin..." 
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  required
                  disabled={sendLoading}
                  autoFocus
                />
              </div>

              {sendFeedback && (
                <div 
                  style={{ 
                    padding: '8px 12px', 
                    fontSize: '0.75rem',
                    background: sendFeedback.type === 'error' ? 'var(--error-dim)' : 'var(--success-dim)',
                    border: `1px solid ${sendFeedback.type === 'error' ? 'var(--error)' : 'var(--success)'}`,
                    color: sendFeedback.type === 'error' ? 'var(--error)' : 'var(--success)',
                    wordBreak: 'break-all'
                  }}
                >
                  {sendFeedback.message}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button 
                  type="submit" 
                  className="admin-btn admin-btn-primary" 
                  style={{ flex: 1, padding: '10px', fontWeight: 'bold' }}
                  disabled={sendLoading || !sendAmount}
                >
                  {sendLoading ? 'Gönderiliyor...' : 'TOKEN GÖNDER'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setSendTargetWallet(null); setSendFeedback(null); }} 
                  className="admin-btn"
                  style={{ width: '100px' }}
                  disabled={sendLoading}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default WalletTable;
