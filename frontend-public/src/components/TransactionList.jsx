import React from 'react';

export function TransactionList({ transactions, currentAddress }) {
  const truncateHash = (hash) => `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;

  if (!transactions || transactions.length === 0) {
    return (
      <div className="cyber-window">
        <div className="cyber-window-header">
          <span className="window-title">TRANSACTION_HISTORY.EXE</span>
          <div className="window-controls">
            <span>[_]</span> <span>[X]</span>
          </div>
        </div>
        <div className="cyber-window-body" style={{ padding: '24px', textAlign: 'center' }}>
          <p className="text-secondary" style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
            No transaction records found on-chain for this wallet address.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-window">
      <div className="cyber-window-header">
        <span className="window-title">TRANSACTION_HISTORY.EXE</span>
        <div className="window-controls">
          <span>[_]</span> <span>[X]</span>
        </div>
      </div>
      <div className="cyber-window-body" style={{ padding: '0' }}>
        
        {/* Scrollable container to prevent page vertical expansion */}
        <div className="cyber-window-scrollbody">
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#0D0E12', zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '8px 12px', fontSize: '0.7rem', borderBottom: '2px solid #FFFFFF' }}>TX HASH</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.7rem', borderBottom: '2px solid #FFFFFF' }}>SENDER</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.7rem', borderBottom: '2px solid #FFFFFF' }}>RECIPIENT</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.7rem', borderBottom: '2px solid #FFFFFF' }}>VALUE</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.7rem', borderBottom: '2px solid #FFFFFF' }}>DATE</th>
                </tr>
              </thead>
              <tbody>
                {transactions.flatMap((tx) => {
                  const isSent = currentAddress && tx.from.toLowerCase() === currentAddress.toLowerCase();
                  const isReceived = currentAddress && tx.to.toLowerCase() === currentAddress.toLowerCase();
                  
                  let amountColor = 'var(--text-primary)';
                  let amountPrefix = '';
                  if (isSent && isReceived) {
                    amountPrefix = '';
                  } else if (isSent) {
                    amountColor = 'var(--error)';
                    amountPrefix = '-';
                  } else if (isReceived) {
                    amountColor = 'var(--success)';
                    amountPrefix = '+';
                  }

                  return [
                    <tr key={tx.hash} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="mono" style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
                        <a 
                          href={`/explorer?tx=${tx.hash}`}
                          style={{ color: '#00C2FF', textDecoration: 'none', fontWeight: 'bold' }}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/explorer?tx=${tx.hash}`;
                          }}
                        >
                          {truncateHash(tx.hash)}
                        </a>
                      </td>
                      <td className="mono" style={{ padding: '8px 12px', fontSize: '0.75rem', opacity: isSent ? 1 : 0.7 }}>
                        {isSent ? 'Self' : truncateHash(tx.from)}
                      </td>
                      <td className="mono" style={{ padding: '8px 12px', fontSize: '0.75rem', opacity: isReceived ? 1 : 0.7 }}>
                        {isReceived ? 'Self' : truncateHash(tx.to)}
                      </td>
                      <td className="mono" style={{ padding: '8px 12px', fontSize: '0.75rem', color: amountColor, fontWeight: 'bold' }}>
                        {amountPrefix}{parseFloat(tx.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} SKH
                      </td>
                      <td className="text-muted" style={{ padding: '8px 12px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>,
                    tx.message && (
                      <tr key={`${tx.hash}-memo`} style={{ background: 'rgba(0, 82, 255, 0.03)' }}>
                        <td colSpan={5} style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#00C2FF', borderTop: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>MEMO:</span>
                            <span style={{ color: '#FFFFFF', fontStyle: 'italic' }}>"{tx.message}"</span>
                            {tx.fee && parseFloat(tx.fee) > 0 && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                                🔥 Message Fee: {tx.fee} SKH burned
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  ];
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
