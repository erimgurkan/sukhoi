import React, { useEffect } from 'react';

export function Toast({ id, message, type = 'info', timestamp, onClose }) {
  useEffect(() => {
    // Auto-remove toast after 5 seconds
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'var(--success)';
      case 'error': return 'var(--error)';
      case 'warning': return 'var(--warning)';
      default: return 'var(--accent)';
    }
  };

  return (
    <div 
      className="toast" 
      style={{ borderLeftColor: getBorderColor() }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {new Date(timestamp).toLocaleTimeString()}
        </span>
        <button 
          onClick={() => onClose(id)}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          ×
        </button>
      </div>
      <div style={{ wordBreak: 'break-word', fontSize: '0.85rem' }}>
        {message}
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast 
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}
