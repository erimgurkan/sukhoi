import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { NetworkCanvas } from '../components/NetworkCanvas';
import * as api from '../services/api';

export function NetworkMap({ wsTransactions }) {
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const walletsData = await api.getWallets();
      if (walletsData.success) {
        setWallets(walletsData.wallets);
      }
      
      const blocksData = await api.getBlocks(null, 10);
      if (blocksData.success) {
        // Extract recent txs from recent blocks
        const recentTxs = [];
        blocksData.blocks.forEach(block => {
          if (block.transactions) {
            block.transactions.forEach(tx => {
              // Only push valid peer-to-peer transfers (not contract deployments)
              if (tx.from && tx.to && tx.from !== '0x0000000000000000000000000000000000000000' && tx.to !== '0x0000000000000000000000000000000000000000') {
                recentTxs.push({
                  hash: tx.hash || tx,
                  from: tx.from,
                  to: tx.to,
                  value: tx.value ? ethers.formatUnits(tx.value, 18) : '0',
                  message: tx.message || '',
                  fee: tx.fee ? ethers.formatUnits(tx.fee, 18) : '0'
                });
              }
            });
          }
        });
        setTransactions(recentTxs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Sync new incoming transactions from WebSocket
  useEffect(() => {
    if (wsTransactions.length > 0) {
      const newestTx = wsTransactions[0];
      setTransactions(prev => [newestTx, ...prev].slice(0, 50));
    }
  }, [wsTransactions]);

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700 }}>Canlı Ağ Haritası</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        
        {/* Canvas Visualizer */}
        <NetworkCanvas wallets={wallets} transactions={transactions} />

        {/* Sidebar Info/Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="panel">
            <div className="panel-header">Harita Bilgisi</div>
            <div className="panel-body" style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="status-dot online" style={{ background: '#E85D00', boxShadow: '0 0 6px #E85D00' }} />
                <span><strong>Admin/Kurucu Düğümü:</strong> Toplam arzın yönetiminden sorumludur.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="status-dot online" style={{ background: '#D4D4D4', boxShadow: 'none' }} />
                <span><strong>İstemci Düğümleri:</strong> Ağa kayıtlı kullanıcı cüzdanları.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="status-dot online" style={{ background: '#777777', boxShadow: 'none' }} />
                <span><strong>Harici Cüzdanlar:</strong> Son işlem gerçekleştiren dış düğümler.</span>
              </div>
            </div>
          </div>

          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-header">Son Transfer Akışları</div>
            <div className="panel-body" style={{ padding: 0, overflowY: 'auto', maxHeight: '300px' }}>
              <table className="data-table" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th>Gönderici ➔ Alıcı</th>
                    <th>Değer</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((tx) => (
                    <tr key={tx.hash}>
                      <td className="mono" style={{ fontSize: '0.7rem' }}>
                        {tx.from.substring(0, 6)}... ➔ {tx.to.substring(0, 6)}...
                      </td>
                      <td className="mono" style={{ color: 'var(--success)' }}>
                        {parseFloat(tx.value).toFixed(2)} SKH
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                        İşlem bekleniyor...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
