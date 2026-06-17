import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Login({ login }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      } else {
        setError('Geçersiz kullanıcı adı veya şifre.');
      }
    } catch (err) {
      setError(err.message || 'Giriş yapılırken sunucu hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box animate-in">
        <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700 }}>Sukhoi Chain</h1>
        <div className="subtitle">Yönetim Paneli (God Mode)</div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="login-field">
            <label>Yönetici Kullanıcı Adı</label>
            <input 
              type="text" 
              className="admin-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="login-field">
            <label>Şifre</label>
            <input 
              type="password" 
              className="admin-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--error)', fontSize: '0.75rem', background: 'var(--error-dim)', border: '1px solid var(--error)', padding: '8px', marginTop: '4px' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="admin-btn admin-btn-primary"
            disabled={loading || !username || !password}
            style={{ width: '100%', padding: '10px', marginTop: '8px' }}
          >
            {loading ? 'Bağlantı Kuruluyor...' : 'GİRİŞ YAP'}
          </button>
        </form>
      </div>
    </div>
  );
}
