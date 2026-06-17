import React, { useState } from 'react';

export function MnemonicDisplay({ mnemonic }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const words = mnemonic ? mnemonic.split(' ') : [];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy mnemonic:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ position: 'relative' }}>
        <div 
          className="mnemonic-grid"
          style={{ 
            filter: revealed ? 'none' : 'blur(6px)',
            transition: 'filter var(--transition)',
            pointerEvents: revealed ? 'auto' : 'none'
          }}
        >
          {words.map((word, index) => (
            <div key={index} className="mnemonic-word">
              <span className="index">{index + 1}.</span>
              <span>{word}</span>
            </div>
          ))}
        </div>
        
        {!revealed && (
          <div 
            onClick={() => setRevealed(true)}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-hover)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              fontSize: '0.9rem',
              color: 'var(--accent)'
            }}
          >
            Kelimeleri Göster (Tıkla)
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={handleCopy} 
          className="btn" 
          disabled={!revealed}
          style={{ flex: 1 }}
        >
          {copied ? 'Kopyalandı ✓' : 'Kelimeleri Kopyala'}
        </button>
        {revealed && (
          <button 
            onClick={() => setRevealed(false)} 
            className="btn" 
            style={{ width: '100px' }}
          >
            Gizle
          </button>
        )}
      </div>
    </div>
  );
}
