import React, { useState, useEffect } from 'react';
import { WalletTable } from '../components/WalletTable';
import * as api from '../services/api';

export function Wallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const data = await api.getWallets();
      if (data.success) {
        setWallets(data.wallets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700 }}>Cüzdan Veritabanı</h2>
        <button 
          onClick={loadWallets} 
          className="admin-btn"
          disabled={loading}
        >
          {loading ? 'Yenileniyor...' : 'Kayıtları Güncelle'}
        </button>
      </div>

      {loading && wallets.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Cüzdan kayıtları yükleniyor...
        </div>
      ) : (
        <WalletTable wallets={wallets} onRefresh={loadWallets} />
      )}
    </div>
  );
}
