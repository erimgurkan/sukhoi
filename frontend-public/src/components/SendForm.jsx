import React, { useState } from 'react';
import { ethers } from 'ethers';
import { BLOCKCHAIN_RPC, CONTRACT_ADDRESS, SKH_ABI } from '../config';

export function SendForm({ senderAddress, onTransactionSent }) {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    // Basic Validations
    if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress.trim())) {
      setFeedback({ type: 'error', message: 'Invalid recipient address format.' });
      setLoading(false);
      return;
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      setFeedback({ type: 'error', message: 'Amount must be a positive number.' });
      setLoading(false);
      return;
    }

    let cleanPrivateKey = privateKey.trim();
    if (!cleanPrivateKey.startsWith('0x')) {
      cleanPrivateKey = '0x' + cleanPrivateKey;
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(cleanPrivateKey)) {
      setFeedback({ type: 'error', message: 'Invalid private key format (64 hex characters required).' });
      setLoading(false);
      return;
    }

    try {
      if (!CONTRACT_ADDRESS) {
        throw new Error('Smart contract address not loaded. Verify backend connection.');
      }

      // Initialize provider and wallet
      const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC);
      const wallet = new ethers.Wallet(cleanPrivateKey, provider);

      // Verify that private key matches sender address
      if (wallet.address.toLowerCase() !== senderAddress.toLowerCase()) {
        throw new Error('Entered Private Key does not match the active session address.');
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, SKH_ABI, wallet);
      const parsedAmount = ethers.parseUnits(amount.trim(), 18);
      let tx;

      if (message.trim().length > 0) {
        setFeedback({ type: 'info', message: 'Preparing transaction with message (0.1 SKH fee will be burned)...' });
        tx = await contract.sendWithMemo(toAddress.trim(), parsedAmount, message.trim());
      } else {
        setFeedback({ type: 'info', message: 'Preparing standard transaction...' });
        tx = await contract.transfer(toAddress.trim(), parsedAmount);
      }

      setFeedback({ type: 'info', message: `Broadcasting transaction... Hash: ${tx.hash.substring(0, 10)}...` });
      
      // Wait for confirmation
      const receipt = await tx.wait();

      setFeedback({ type: 'success', message: `Transaction confirmed successfully! Hash: ${receipt.hash}` });
      
      // Reset inputs
      setToAddress('');
      setAmount('');
      setMessage('');
      setPrivateKey('');
      
      if (onTransactionSent) {
        onTransactionSent();
      }
    } catch (err) {
      console.error('Send token error:', err);
      setFeedback({ 
        type: 'error', 
        message: err.reason || err.message || 'Error occurred while executing send transaction.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-window">
      <div className="cyber-window-header">
        <span className="window-title">SEND_TOKENS.EXE</span>
        <div className="window-controls">
          <span>[_]</span> <span>[X]</span>
        </div>
      </div>
      <div className="cyber-window-body" style={{ padding: '16px' }}>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Recipient Ethereum Address
            </label>
            <input 
              type="text" 
              className="input" 
              placeholder="0x..." 
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              required
              disabled={loading}
              style={{ padding: '8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Amount (SKH)
            </label>
            <input 
              type="text" 
              className="input" 
              placeholder="0.0" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
              style={{ padding: '8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Memo / Message (Optional — Burns 0.1 SKH fee 🔥)
            </label>
            <input 
              type="text" 
              className="input" 
              placeholder="Attach private message to block..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              style={{ padding: '8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Your Wallet Private Key
            </label>
            <input 
              type="password" 
              className="input" 
              placeholder="Sign transaction locally" 
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              required
              disabled={loading}
              style={{ padding: '8px' }}
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              * Private key never leaves your browser. Used strictly to sign payload locally.
            </span>
          </div>

          {feedback && (
            <div 
              className={`form-feedback ${feedback.type}`}
              style={{ 
                padding: '8px', 
                fontSize: '0.8rem',
                wordBreak: 'break-all'
              }}
            >
              {feedback.message}
            </div>
          )}

          <button 
            type="submit" 
            className="cyber-btn cyber-btn-primary"
            disabled={loading || !toAddress || !amount || !privateKey}
            style={{ padding: '10px', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '4px' }}
          >
            {loading ? 'EXECUTING SIGNATURE...' : 'BROADCAST TRANSACTION'}
          </button>
        </form>
      </div>
    </div>
  );
}
