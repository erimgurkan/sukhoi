import React from 'react';

export function BlockFeed({ blocks, isConnected }) {
  const truncateHash = (hash) => `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Canlı Blok Akışı</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
          <span style={{ color: isConnected ? 'var(--success)' : 'var(--error)' }}>
            {isConnected ? 'CANLI' : 'BAĞLANTI YOK'}
          </span>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            Ağdan blok verisi bekleniyor...
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
          {blocks.map((block) => (
            <div 
              key={block.hash} 
              className="card"
              style={{ 
                padding: '12px 16px', 
                background: 'rgba(255, 255, 255, 0.01)',
                borderColor: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                animation: 'fadeIn 0.3s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    #{block.number}
                  </span>
                  <span className="mono" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    {truncateHash(block.hash)}
                  </span>
                </div>
                <div className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  {new Date(block.timestamp).toLocaleTimeString()} • {block.transactionCount || 0} işlem
                </div>
              </div>
              
              <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>Gaz Kullanımı</div>
                <div className="mono">{parseInt(block.gasUsed || 0).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
