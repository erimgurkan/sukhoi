import React, { useState } from 'react';
import { MnemonicDisplay } from './MnemonicDisplay';

export function WalletCreate({ onCreate, mnemonic, onComplete }) {
  const [created, setCreated] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await onCreate();
      setCreated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
      {!created ? (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Yeni Cüzdan Oluştur</h2>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
            Sukhoi Chain ağında işlem yapabilmek için 12 kelimelik kurtarma ifadesiyle korunan yeni bir HD cüzdan oluşturun.
          </p>
          <button 
            onClick={handleCreate} 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '14px' }}
          >
            {loading ? 'Oluşturuluyor...' : 'Cüzdan Oluştur'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--accent)' }}>Kurtarma İfadesi</h2>
          
          <div 
            style={{ 
              padding: '12px', 
              background: 'var(--accent-subtle)', 
              border: '1px solid rgba(232, 93, 0, 0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              color: 'var(--accent)'
            }}
          >
            <strong>ÖNEMLİ GÜVENLİK UYARISI:</strong> Aşağıdaki 12 kelimeyi güvenli ve gizli bir yere kaydedin (kağıda yazmanız önerilir). Bu kelimeler cüzdanınızı kurtarmanın tek yoludur ve bir daha gösterilmeyecektir.
          </div>

          <MnemonicDisplay mnemonic={mnemonic} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '8px' }}>
            <input 
              type="checkbox" 
              id="confirm-checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: '5px', accentColor: 'var(--accent)' }}
            />
            <label htmlFor="confirm-checkbox" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              12 kelimeyi güvenli bir yere kopyaladığımı ve kaydettiğimi onaylıyorum.
            </label>
          </div>

          <button 
            onClick={onComplete}
            className="btn btn-primary" 
            disabled={!confirmed}
            style={{ width: '100%', padding: '14px', marginTop: '8px' }}
          >
            Devam Et (Dashboard'a Git)
          </button>
        </div>
      )}
    </div>
  );
}
