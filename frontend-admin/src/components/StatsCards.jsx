import React from 'react';

export function StatsCards({ stats }) {
  const {
    tokenName = 'Sukhoi',
    tokenSymbol = 'SKH',
    totalSupply = '1,000,000,000',
    contractAddress = '0x...',
    registeredWallets = 0,
    latestBlock = 0,
    connectedClients = 0,
    isPaused = false
  } = stats || {};

  return (
    <div className="stats-grid animate-in">
      
      {/* Total Supply Card */}
      <div className="stat-card">
        <div className="label">Toplam Arz ({tokenSymbol})</div>
        <div className="value accent">
          {parseFloat(totalSupply).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <div className="change" style={{ color: 'var(--text-muted)' }}>
          Yerel Token: {tokenName}
        </div>
      </div>

      {/* Latest Block Card */}
      <div className="stat-card">
        <div className="label">Aktif Blok Yüksekliği</div>
        <div className="value">#{latestBlock}</div>
        <div className="change up">
          ▲ Canlı Akış Aktif
        </div>
      </div>

      {/* Registered Wallets Card */}
      <div className="stat-card">
        <div className="label">Kayıtlı Cüzdan Sayısı</div>
        <div className="value">{registeredWallets}</div>
        <div className="change" style={{ color: 'var(--text-secondary)' }}>
          Ağa Kayıtlı Hesaplar
        </div>
      </div>

      {/* WebSocket Connected Clients Card */}
      <div className="stat-card">
        <div className="label">Bağlantılar (WS)</div>
        <div className="value">{connectedClients} client</div>
        <div className="change" style={{ color: 'var(--success)' }}>
          ● API / Düğüm Bağlantısı
        </div>
      </div>

      {/* Network Status Control Info Card */}
      <div className="stat-card" style={{ gridColumn: 'span 2' }}>
        <div className="label">Akıllı Sözleşme Adresi</div>
        <div className="value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', wordBreak: 'break-all', marginTop: '4px' }}>
          {contractAddress}
        </div>
        <div className="change" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
          <span className={`status-dot ${isPaused ? 'offline' : 'online'}`} />
          <span style={{ color: isPaused ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
            {isPaused ? 'İŞLEMLER DURDURULDU (PAUSED)' : 'AĞ AKTİF (TRANSFERLER AÇIK)'}
          </span>
        </div>
      </div>

    </div>
  );
}
