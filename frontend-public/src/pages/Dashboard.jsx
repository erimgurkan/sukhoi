import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BLOCKCHAIN_RPC, CONTRACT_ADDRESS, SKH_ABI } from '../config';
import { contributePresale } from '../services/api';
import { SendForm } from '../components/SendForm';
import { TransactionList } from '../components/TransactionList';

// Inline premium vector SVGs for blockchain network logos
const EthLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <path d="M12 2L4 13.5L12 17L20 13.5L12 2Z" fill="#3C3C3D"/>
    <path d="M12 17L4 13.5L12 22L20 13.5L12 17Z" fill="#8C8C8C"/>
    <path d="M12 2L12 17L20 13.5L12 2Z" fill="#141414" fillOpacity="0.1"/>
    <path d="M12 17L12 22L20 13.5L12 17Z" fill="#141414" fillOpacity="0.1"/>
  </svg>
);

const SolLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <path d="M4 17.5H20L17.5 20H1.5L4 17.5Z" fill="url(#solGradientDashboard)"/>
    <path d="M20 11.5H4L1.5 14H17.5L20 11.5Z" fill="url(#solGradientDashboard)"/>
    <path d="M4 5.5H20L17.5 8H1.5L4 5.5Z" fill="url(#solGradientDashboard)"/>
    <defs>
      <linearGradient id="solGradientDashboard" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#9945FF"/>
        <stop offset="100%" stopColor="#14F195"/>
      </linearGradient>
    </defs>
  </svg>
);

const TrxLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <path d="M12 2L2 6.5L11 22L12 22L21 6.5L12 2Z" fill="#EC0623"/>
    <path d="M12 2L12 22L21 6.5L12 2Z" fill="#B30517"/>
    <path d="M12 6.5L5.5 8L12 17L18.5 8L12 6.5Z" fill="#FFFFFF" fillOpacity="0.2"/>
  </svg>
);

const TonLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.29 9.38L14.77 15.68C14.67 16.11 14.41 16.21 14.05 16.01L11.73 14.3L10.61 15.38C10.49 15.5 10.39 15.6 10.19 15.6L10.36 13.2L14.74 9.24C14.93 9.07 14.7 8.98 14.45 9.15L9.03 12.56L6.7 11.83C6.19 11.67 6.18 11.32 6.81 11.07L15.93 7.55C16.35 7.39 16.72 7.64 16.29 9.38Z" fill="#0098EA"/>
  </svg>
);

const depositAddresses = {
  'ERC20': '0xE2e6C704736aF4E377B661FAD5565080A7Fb679a',
  'Solana': 'Hz42xEzJEW54RgecjfmZRa31wDGbT3Z3hLDnvdbSLBJE',
  'Tron': 'TGkHLpuiz1zinTgekFRW61JDcLDXx5Lvpi',
  'Ton': 'UQDjc_tOL-uZ-lUl_b78Wad3v6ISBfTL23tKjDzDwYX9wxXi'
};

export function Dashboard({ wallet, refreshWallet }) {
  const [showSend, setShowSend] = useState(false);
  const [copied, setCopied] = useState(false);

  // Buy Swap States
  const [swapMode, setSwapMode] = useState('buy'); // 'buy'
  const [paymentToken, setPaymentToken] = useState('ERC20');
  const [payAmount, setPayAmount] = useState('5000');
  const [recAmount, setRecAmount] = useState('2.00');
  const [buyFeedback, setBuyFeedback] = useState(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [senderWallet, setSenderWallet] = useState('');
  const [txTime, setTxTime] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Countdown timer inside wallet
  const [countdown, setCountdown] = useState({ days: 12, hours: 4, minutes: 15, seconds: 30 });

  const {
    address,
    balance,
    transactions,
    loading,
    error,
    logout,
    refreshBalance
  } = wallet;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!address) {
    window.location.href = '/';
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyDepositAddress = async () => {
    const targetAddr = depositAddresses[paymentToken];
    if (!targetAddr) return;
    try {
      await navigator.clipboard.writeText(targetAddr);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayAmountChange = (val) => {
    setPayAmount(val);
    if (isNaN(val) || parseFloat(val) <= 0) {
      setRecAmount('0.00');
    } else {
      setRecAmount((parseFloat(val) / 2500).toFixed(4));
    }
  };

  const handleBuyTokens = async (e) => {
    e.preventDefault();
    setBuyLoading(true);
    setBuyFeedback(null);
    try {
      const combinedMemo = `Sender: ${senderWallet} | Time: ${txTime}`;
      const data = await contributePresale(address, payAmount, paymentToken, combinedMemo);
      if (data.success) {
        setBuyFeedback({
          type: 'success',
          message: `Ticket submitted! Admin will verify and transfer ${recAmount} SKH shortly.`
        });
        setPayAmount('5000');
        setRecAmount('2.00');
        setSenderWallet('');
        setTxTime('');
        if (refreshBalance) refreshBalance();
      }
    } catch (err) {
      console.error(err);
      setBuyFeedback({
        type: 'error',
        message: err.message || 'Failed to submit contribution request. Try again.'
      });
    } finally {
      setBuyLoading(false);
    }
  };

  const handleTransactionSent = async () => {
    setShowSend(false);
    await refreshBalance();
    if (refreshWallet) refreshWallet();
  };

  return (
    <div style={{ position: 'relative', background: 'transparent', minHeight: '100vh', width: '100%', paddingBottom: '45px', paddingTop: '45px', overflowX: 'hidden' }}>
      
      {/* Top Ticker Marquee */}
      <div className="marquee-container">
        <div className="marquee-content">
          <span>SUKHOI CHAIN TERMINAL OPERATIONAL • SECURE EVM-EQUIVALENT WALLET SESSION • 0.1 SKH MEMO FEE PERMANENTLY BURNED • </span>
          <span>SUKHOI CHAIN TERMINAL OPERATIONAL • SECURE EVM-EQUIVALENT WALLET SESSION • 0.1 SKH MEMO FEE PERMANENTLY BURNED • </span>
        </div>
      </div>

      <div className="container" style={{ marginTop: '20px' }}>
        
        {/* Title area */}
        <div className="project-hero" style={{ marginBottom: '16px' }}>
          <h1 className="cyber-glow-text" style={{ fontSize: '2.5rem' }}>SUKHOI WALLET OS</h1>
          <p className="cyber-subtitle" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            LOCAL PRIVACY ENCRYPTED SESSION // HOST STATUS: ONLINE
          </p>
        </div>

        {/* 2-Column Dashboard Grid */}
        <div className="dashboard-layout-grid" style={{ gap: '20px' }}>
          
          {/* Left Column: Wallet Stats, Balance & Presale Swap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Wallet Status Window */}
            <div className="cyber-window">
              <div className="cyber-window-header">
                <span className="window-title">WALLET_STATUS.LOG</span>
                <div className="window-controls">
                  <span>[_]</span> <span>[X]</span>
                </div>
              </div>
              <div className="cyber-window-body" style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.65rem', color: '#AAAAAA', textTransform: 'uppercase', display: 'block', fontFamily: 'var(--font-mono)' }}>
                  Active EVM Account Address
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0 12px 0' }}>
                  <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FFFFFF', wordBreak: 'break-all' }}>
                    {address}
                  </span>
                </div>

                <div className="security-notice-box" style={{ padding: '8px', marginBottom: '12px', background: 'rgba(0, 82, 255, 0.05)', borderColor: '#0052FF', borderLeftColor: '#0052FF' }}>
                  <strong style={{ color: '#0052FF', fontSize: '0.75rem' }}>🛡️ SECURITY DIRECTIVE:</strong>
                  <p style={{ fontSize: '0.7rem', marginTop: '2px', color: '#AAAAAA' }}>
                    Your keys are held client-side. Make sure to back up your 12-word mnemonic phrase. Disconnecting deletes local storage caches.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={handleCopy} 
                    className="cyber-btn" 
                    style={{ flex: 1, padding: '8px', fontSize: '0.75rem' }}
                  >
                    {copied ? 'COPIED ✓' : 'COPY ADDRESS'}
                  </button>
                  <button 
                    onClick={logout} 
                    className="cyber-btn" 
                    style={{ flex: 1, padding: '8px', fontSize: '0.75rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                  >
                    DISCONNECT SESSION
                  </button>
                </div>
              </div>
            </div>

            {/* Balance Status Window */}
            <div className="cyber-window">
              <div className="cyber-window-header">
                <span className="window-title">BALANCE_STATUS.SYS</span>
                <div className="window-controls">
                  <span>[_]</span> <span>[X]</span>
                </div>
              </div>
              <div className="cyber-window-body" style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.65rem', color: '#AAAAAA', textTransform: 'uppercase', display: 'block', fontFamily: 'var(--font-mono)' }}>
                  SKH Token Balance
                </span>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '8px 0 16px 0' }}>
                  <span className="mono" style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0052FF', textShadow: '0 0 10px rgba(0, 82, 255, 0.2)' }}>
                    {parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </span>
                  <span style={{ fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                    SKH
                  </span>
                </div>

                {error && (
                  <div className="form-feedback error" style={{ padding: '8px', marginBottom: '12px' }}>
                    Error: {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setShowSend(!showSend)} 
                    className="cyber-btn cyber-btn-primary"
                    style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }}
                  >
                    {showSend ? 'HIDE PANEL' : 'SEND TOKENS'}
                  </button>
                  <button 
                    onClick={() => refreshBalance()} 
                    className="cyber-btn"
                    disabled={loading}
                    style={{ width: '120px', padding: '10px', fontSize: '0.8rem' }}
                  >
                    {loading ? 'SYNCING...' : 'REFRESH'}
                  </button>
                </div>
              </div>
            </div>

            {/* Send Token Form Window (Toggled here) */}
            {showSend && (
              <div style={{ animation: 'fadeIn 0.2s ease', marginTop: '12px' }}>
                <SendForm 
                  senderAddress={address} 
                  onTransactionSent={handleTransactionSent} 
                />
              </div>
            )}

            {/* Transaction History Window (Moved to Left Column) */}
            <TransactionList 
              transactions={transactions} 
              currentAddress={address} 
            />

          </div>

          {/* Right Column: Swap Engine (Only for Buying/Selling Coins) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Presale Swap OS Window */}
            <div className="cyber-window window-glowing">
              <div className="cyber-window-header header-glow">
                <span className="window-title">TOKEN_SWAP_INTERFACE.EXE</span>
                <div className="window-controls">
                  <span>[_]</span> <span>[X]</span>
                </div>
              </div>
              <div className="cyber-window-body" style={{ padding: '16px' }}>
                
                {/* Mode Tabs */}
                <div className="swap-mode-tabs">
                  <button 
                    onClick={() => setSwapMode('buy')} 
                    className="swap-mode-tab active"
                  >
                    Buy SKH
                  </button>
                </div>

                {/* Presale Countdown */}
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.65rem', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PRESALE ENDS IN</span>
                    <div className="countdown-timer-row" style={{ gap: '6px', marginTop: '4px' }}>
                      <div className="time-block" style={{ minWidth: '45px', padding: '4px 2px' }}>
                        <span className="time-num" style={{ fontSize: '1rem' }}>{String(countdown.days).padStart(2, '0')}</span>
                        <span className="time-lbl" style={{ fontSize: '0.55rem' }}>Days</span>
                      </div>
                      <div className="time-block" style={{ minWidth: '45px', padding: '4px 2px' }}>
                        <span className="time-num" style={{ fontSize: '1rem' }}>{String(countdown.hours).padStart(2, '0')}</span>
                        <span className="time-lbl" style={{ fontSize: '0.55rem' }}>Hours</span>
                      </div>
                      <div className="time-block" style={{ minWidth: '45px', padding: '4px 2px' }}>
                        <span className="time-num" style={{ fontSize: '1rem' }}>{String(countdown.minutes).padStart(2, '0')}</span>
                        <span className="time-lbl" style={{ fontSize: '0.55rem' }}>Mins</span>
                      </div>
                      <div className="time-block" style={{ minWidth: '45px', padding: '4px 2px' }}>
                        <span className="time-num" style={{ fontSize: '1rem' }}>{String(countdown.seconds).padStart(2, '0')}</span>
                        <span className="time-lbl" style={{ fontSize: '0.55rem' }}>Secs</span>
                      </div>
                    </div>
                  </div>

                {/* Price alert */}
                <div className="presale-price-bar" style={{ padding: '8px 12px', marginBottom: '12px' }}>
                  <span>ACTIVE SWAP RATE:</span>
                  <span className="price-tag">1 SKH = 2,500 USDT</span>
                </div>

                {/* BUY MODE FORM */}
                  <form onSubmit={handleBuyTokens} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    
                    {/* Deposit Network Selector Tabs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.65rem', color: '#AAAAAA', fontFamily: 'var(--font-mono)' }}>SELECT DEPOSIT NETWORK</label>
                      <div className="payment-tabs-row" style={{ gap: '4px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        <button type="button" onClick={() => setPaymentToken('ERC20')} className={`pay-tab ${paymentToken === 'ERC20' ? 'active' : ''}`} style={{ padding: '6px 2px', fontSize: '0.7rem' }}>ERC20</button>
                        <button type="button" onClick={() => setPaymentToken('Solana')} className={`pay-tab ${paymentToken === 'Solana' ? 'active' : ''}`} style={{ padding: '6px 2px', fontSize: '0.7rem' }}>Solana</button>
                        <button type="button" onClick={() => setPaymentToken('Tron')} className={`pay-tab ${paymentToken === 'Tron' ? 'active' : ''}`} style={{ padding: '6px 2px', fontSize: '0.7rem' }}>Tron</button>
                        <button type="button" onClick={() => setPaymentToken('Ton')} className={`pay-tab ${paymentToken === 'Ton' ? 'active' : ''}`} style={{ padding: '6px 2px', fontSize: '0.7rem' }}>Ton</button>
                      </div>
                    </div>

                    {/* Display Active deposit info based on selector */}
                    <div style={{ border: '1px solid var(--border)', background: '#050505', padding: '8px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                        {paymentToken === 'ERC20' && <EthLogo />}
                        {paymentToken === 'Solana' && <SolLogo />}
                        {paymentToken === 'Tron' && <TrxLogo />}
                        {paymentToken === 'Ton' && <TonLogo />}
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#FFFFFF', marginLeft: '6px' }}>
                          USDT-{paymentToken} Deposit Address
                        </span>
                      </div>
                      
                      <span className="mono" style={{ display: 'block', fontSize: '0.75rem', color: '#00C2FF', wordBreak: 'break-all', marginBottom: '8px' }}>
                        {depositAddresses[paymentToken]}
                      </span>

                      <button 
                        type="button" 
                        onClick={handleCopyDepositAddress} 
                        className="cyber-btn" 
                        style={{ width: '100%', padding: '6px', fontSize: '0.7rem', border: '1px solid #FFFFFF' }}
                      >
                        {copiedAddress ? 'COPIED ✓' : 'COPY ADDRESS'}
                      </button>
                    </div>

                    <div className="swap-input-container" style={{ marginTop: '4px' }}>
                      <label>PAY AMOUNT (USDT)</label>
                      <div className="input-group">
                        <input 
                          type="text" 
                          value={payAmount} 
                          onChange={(e) => handlePayAmountChange(e.target.value)} 
                          placeholder="0.00"
                          disabled={buyLoading}
                          style={{ padding: '8px' }}
                        />
                        <span className="addon" style={{ padding: '8px 12px', minWidth: '60px' }}>USDT</span>
                      </div>
                    </div>

                    <div className="swap-input-container">
                      <label>RECEIVE SKH</label>
                      <div className="input-group">
                        <input 
                          type="text" 
                          value={recAmount} 
                          readOnly 
                          placeholder="0.00"
                          style={{ padding: '8px' }}
                        />
                        <span className="addon" style={{ color: '#0052FF', padding: '8px 12px', minWidth: '60px' }}>SKH</span>
                      </div>
                    </div>

                    <div className="swap-input-container">
                      <label>SENDER WALLET ADDRESS</label>
                      <div className="input-group">
                        <input 
                          type="text" 
                          value={senderWallet} 
                          onChange={(e) => setSenderWallet(e.target.value)} 
                          placeholder="Your USDT wallet address"
                          disabled={buyLoading}
                          required
                          style={{ padding: '8px' }}
                        />
                      </div>
                    </div>

                    <div className="swap-input-container">
                      <label>TRANSACTION TIME (HH:MM)</label>
                      <div className="input-group">
                        <input 
                          type="text" 
                          value={txTime} 
                          onChange={(e) => setTxTime(e.target.value)} 
                          placeholder="e.g. 14:30"
                          disabled={buyLoading}
                          required
                          style={{ padding: '8px' }}
                        />
                      </div>
                    </div>

                    {buyFeedback && (
                      <div className={`form-feedback ${buyFeedback.type}`} style={{ padding: '8px' }}>
                        {buyFeedback.message}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="cyber-btn cyber-btn-primary" 
                      disabled={buyLoading}
                      style={{ width: '100%', padding: '10px', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '4px' }}
                    >
                      {buyLoading ? 'SUBMITTING...' : 'SUBMIT DEPOSIT NOTIFICATION'}
                    </button>
                  </form>

              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Bottom Ticker Marquee */}
      <div className="marquee-container" style={{ position: 'absolute', bottom: 0, top: 'auto', borderTop: '2px solid #FFFFFF', borderBottom: 'none' }}>
        <div className="marquee-content">
          <span>CLIENT-SIDE SIGNING ENFORCED • PRIVATE KEYS NEVER TRANSMITTED TO SERVERS • ZERO BACKEND RETENTION • DECENTRALIZED BY DESIGN • </span>
          <span>CLIENT-SIDE SIGNING ENFORCED • PRIVATE KEYS NEVER TRANSMITTED TO SERVERS • ZERO BACKEND RETENTION • DECENTRALIZED BY DESIGN • </span>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
