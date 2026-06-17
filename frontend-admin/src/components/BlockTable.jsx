import React, { useState } from 'react';

export function BlockTable({ blocks, onLoadMore, hasMore }) {
  const [expandedBlock, setExpandedBlock] = useState(null);

  const toggleBlock = (blockNumber) => {
    if (expandedBlock === blockNumber) {
      setExpandedBlock(null);
    } else {
      setExpandedBlock(blockNumber);
    }
  };

  const truncateHash = (hash) => `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}`;
  const truncateAddress = (addr) => `${addr.substring(0, 8)}...${addr.substring(addr.length - 8)}`;

  return (
    <div className="panel animate-in">
      <div className="panel-header">
        <span>Ağ Blok Geçmişi</span>
        <span>{blocks.length} Blok Listeleniyor</span>
      </div>
      
      <div className="panel-body" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Blok Numarası</th>
              <th>Blok Hash</th>
              <th>İşlem Sayısı</th>
              <th>Kullanılan Gaz</th>
              <th>Zaman</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => {
              const isExpanded = expandedBlock === block.number;
              const hasTransactions = block.transactions && block.transactions.length > 0;
              
              return (
                <React.Fragment key={block.number}>
                  {/* Main Block Row */}
                  <tr 
                    onClick={() => toggleBlock(block.number)}
                    style={{ cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.01)' : 'transparent' }}
                  >
                    <td className="mono" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                      #{block.number}
                    </td>
                    <td className="mono font-size-sm">
                      {truncateHash(block.hash)}
                    </td>
                    <td className="mono">
                      {block.transactionCount !== undefined ? block.transactionCount : (block.transactions ? block.transactions.length : 0)} tx
                    </td>
                    <td className="mono">
                      {parseInt(block.gasUsed || 0).toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(block.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>

                  {/* Expanded Transaction Sub-Table Row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} style={{ background: '#070707', padding: '16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ padding: '4px 12px' }}>
                          <h4 style={{ color: 'var(--accent)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                            Blok #{block.number} İçerisindeki İşlemler
                          </h4>
                          
                          {!hasTransactions ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Bu blokta işlem bulunmuyor (boş blok).</p>
                          ) : (
                            <table className="data-table" style={{ background: 'transparent', width: '100%', border: 'none' }}>
                              <thead>
                                <tr>
                                  <th style={{ background: 'transparent' }}>İşlem Hash</th>
                                  <th style={{ background: 'transparent' }}>Gönderici (From)</th>
                                  <th style={{ background: 'transparent' }}>Alıcı (To)</th>
                                  <th style={{ background: 'transparent' }}>Miktar (SKH)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {block.transactions.map((tx) => {
                                  // Sometimes transactions are returned as objects or string hashes depending on HTTP/WS details
                                  const txHash = typeof tx === 'string' ? tx : tx.hash;
                                  const txFrom = tx.from || 'Bilinmiyor';
                                  const txTo = tx.to || 'Bilinmiyor';
                                  const txValue = tx.value ? parseFloat(tx.value).toFixed(2) : '0.00';

                                  return (
                                    <tr key={txHash} style={{ borderBottom: 'none' }}>
                                      <td className="mono hash" style={{ fontSize: '0.75rem' }}>
                                        {truncateHash(txHash)}
                                      </td>
                                      <td className="mono" style={{ fontSize: '0.75rem' }}>
                                        {truncateAddress(txFrom)}
                                      </td>
                                      <td className="mono" style={{ fontSize: '0.75rem' }}>
                                        {truncateAddress(txTo)}
                                      </td>
                                      <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                                        {txValue} SKH
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {hasMore && onLoadMore && (
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
            <button onClick={onLoadMore} className="admin-btn">
              Daha Fazla Yükle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
