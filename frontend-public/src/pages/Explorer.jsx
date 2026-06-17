import React, { useState, useEffect } from 'react';
import { BlockFeed } from '../components/BlockFeed';
import * as api from '../services/api';

export function Explorer({ blocks, isConnected }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Check URL query parameters for tx detail link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txHash = params.get('tx');
    if (txHash) {
      setSearchQuery(txHash);
      handleSearch(null, txHash);
    }
  }, []);

  const handleSearch = async (e, directQuery = null) => {
    if (e) e.preventDefault();
    const query = (directQuery || searchQuery).trim();
    if (!query) return;

    setSearchLoading(true);
    setSearchError('');
    setSearchResult(null);

    try {
      if (/^0x[a-fA-F0-9]{64}$/.test(query)) {
        // Hash is a Transaction Hash
        const data = await api.getTransactionDetails(query);
        if (data.success && data.transaction) {
          setSearchResult({
            type: 'transaction',
            data: data.transaction,
            receipt: data.receipt
          });
        } else {
          setSearchError('İşlem bulunamadı.');
        }
      } else if (/^\d+$/.test(query)) {
        // Query is a Block Number
        const res = await fetch(`/api/admin/blocks/${query}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('sukhoi_admin_token')}` }
        });
        const data = await res.json();
        if (data.success && data.block) {
          setSearchResult({
            type: 'block',
            data: data.block
          });
        } else {
          // If no admin token, try loading block info through provider
          setSearchError('Blok detayı aranamadı veya admin girişi gerekiyor.');
        }
      } else if (/^0x[a-fA-F0-9]{40}$/.test(query)) {
        // Query is an Address
        const data = await api.getWallet(query);
        if (data.success) {
          setSearchResult({
            type: 'address',
            address: query,
            data
          });
        } else {
          setSearchError('Adres bilgisi yüklenemedi.');
        }
      } else {
        setSearchError('Geçersiz arama parametresi. Blok no, adres veya işlem hash girin.');
      }
    } catch (err) {
      console.error(err);
      setSearchError('Arama gerçekleştirilirken bir hata oluştu veya veri bulunamadı.');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="container page">
      <h2 style={{ marginBottom: '24px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Blok Gezgini</h2>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <input 
          type="text" 
          className="input" 
          placeholder="Blok No, Cüzdan Adresi (0x...) veya İşlem Hash (0x...)" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={searchLoading}
          style={{ flex: 1 }}
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={searchLoading || !searchQuery.trim()}
          style={{ padding: '12px 24px' }}
        >
          {searchLoading ? 'Aranıyor...' : 'Ara'}
        </button>
      </form>

      {/* Search Result Display */}
      {searchError && (
        <div style={{ color: 'var(--error)', fontSize: '0.85rem', background: 'var(--error-dim)', border: '1px solid var(--error)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '32px' }}>
          {searchError}
        </div>
      )}

      {searchResult && (
        <div className="card" style={{ marginBottom: '32px', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600 }}>
              Arama Sonucu: {searchResult.type === 'transaction' ? 'İŞLEM (TX)' : searchResult.type === 'block' ? 'BLOK' : 'ADRES / CÜZDAN'}
            </h3>
            <button 
              onClick={() => { setSearchResult(null); setSearchQuery(''); }}
              className="btn" 
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              Kapat
            </button>
          </div>

          {/* TX Result Details */}
          {searchResult.type === 'transaction' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>İşlem Hash:</span>
                <div className="mono" style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{searchResult.data.hash}</div>
              </div>
              <div className="explorer-result-grid">
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Gönderici:</span>
                  <div className="mono" style={{ wordBreak: 'break-all' }}>{searchResult.data.from}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Alıcı:</span>
                  <div className="mono" style={{ wordBreak: 'break-all' }}>{searchResult.data.to}</div>
                </div>
              </div>
              <div className="explorer-result-grid">
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Değer / Miktar:</span>
                  <div className="mono" style={{ color: 'var(--success)', fontWeight: 600 }}>
                    {searchResult.data.value ? ethers.formatUnits(searchResult.data.value, 18) : parseFloat(ethers.formatUnits(searchResult.data.value || 0, 18))} SKH
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Blok Numarası:</span>
                  <div className="mono" style={{ color: 'var(--accent)' }}>#{searchResult.data.blockNumber}</div>
                </div>
              </div>
              {searchResult.receipt && (
                <div className="explorer-result-grid">
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Kullanılan Gaz:</span>
                    <div className="mono">{parseInt(searchResult.receipt.gasUsed).toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Durum:</span>
                    <div className="mono" style={{ color: searchResult.receipt.status === 1 ? 'var(--success)' : 'var(--error)' }}>
                      {searchResult.receipt.status === 1 ? 'BAŞARILI ✓' : 'BAŞARISIZ ✗'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Block Result Details */}
          {searchResult.type === 'block' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div className="explorer-result-grid">
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Blok Numarası:</span>
                  <div className="mono" style={{ color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 700 }}>#{searchResult.data.number}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Zaman Damgası:</span>
                  <div>{new Date(searchResult.data.timestamp).toLocaleString()}</div>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Blok Hash:</span>
                <div className="mono" style={{ wordBreak: 'break-all' }}>{searchResult.data.hash}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Ebeveyn Hash (Parent Hash):</span>
                <div className="mono" style={{ wordBreak: 'break-all', opacity: 0.8 }}>{searchResult.data.parentHash}</div>
              </div>
              <div className="explorer-result-grid">
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>İşlem Sayısı:</span>
                  <div className="mono">{searchResult.data.transactions ? searchResult.data.transactions.length : 0} adet</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Gaz Tüketimi:</span>
                  <div className="mono">{parseInt(searchResult.data.gasUsed || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Address Result Details */}
          {searchResult.type === 'address' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Cüzdan Adresi:</span>
                <div className="mono" style={{ fontWeight: 600 }}>{searchResult.address}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Bakiye:</span>
                <div className="mono" style={{ color: 'var(--accent)', fontSize: '1.4rem', fontWeight: 700 }}>
                  {parseFloat(searchResult.data.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} SKH
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>İşlem Adeti (Son 100 Blok):</span>
                <div className="mono">{searchResult.data.transactions ? searchResult.data.transactions.length : 0} adet</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Blocks and WS Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <BlockFeed blocks={blocks} isConnected={isConnected} />
      </div>
    </div>
  );
}
export { api }; // API module export
