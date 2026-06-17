import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


export function Landing({ address, balance, refreshBalance, createWallet, recoverWallet, mnemonic, latestBlock, connectedClients }) {
  const navigate = useNavigate();
  const [flowState, setFlowState] = useState('landing'); // 'landing', 'create', 'recover'
  const [created, setCreated] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createProgress, setCreateProgress] = useState(0);
  const [connectLoading, setConnectLoading] = useState(false);
  
  const [recoverPhrase, setRecoverPhrase] = useState('');
  const [recoverError, setRecoverError] = useState('');
  
  // Storage for generated mnemonic during wizard setup
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');

  // Fake presale countdown
  const [countdown, setCountdown] = useState({ days: 12, hours: 4, minutes: 15, seconds: 30 });

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



  const [createError, setCreateError] = useState('');
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);

  const handleCreateWallet = async () => {
    setCreateLoading(true);
    setCreateError('');
    setCreateProgress(0);

    const duration = 1500; // 1.5s animation duration
    const step = 30; // interval step in ms
    const increment = (step / duration) * 100;

    const progressTimer = setInterval(() => {
      setCreateProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + increment;
      });
    }, step);

    try {
      // Create wallet completely client-side in the browser using ethers
      const res = await createWallet();

      // Wait for progress bar animation to complete
      await new Promise((resolve) => setTimeout(resolve, duration + 100));

      if (res && res.mnemonic) {
        setGeneratedMnemonic(res.mnemonic);
        setCreated(true);
      } else {
        setCreateError('Failed to generate mnemonic. Please try again.');
      }
    } catch (err) {
      console.error(err);
      clearInterval(progressTimer);
      setCreateError(err.message || 'Exceeded wallet limit or server connection error.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleConnectCreatedWallet = async () => {
    if (!generatedMnemonic) return;
    setConnectLoading(true);
    setCreateError('');
    try {
      await recoverWallet(generatedMnemonic);
      navigateToDashboard();
    } catch (err) {
      console.error(err);
      setCreateError(err.message || 'Failed to login with generated wallet.');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleRecoverSubmit = async (e) => {
    e.preventDefault();
    setRecoverError('');
    if (!recoverPhrase.trim()) {
      setRecoverError('Mnemonic seed phrase cannot be empty.');
      return;
    }
    setConnectLoading(true);
    try {
      await recoverWallet(recoverPhrase.trim().replace(/\s+/g, ' '));
      navigateToDashboard();
    } catch (err) {
      setRecoverError(err.message || 'Recovery failed. Verify your mnemonic words.');
    } finally {
      setConnectLoading(false);
    }
  };

  const navigateToDashboard = () => {
    navigate('/dashboard');
  };



  const handleDisconnect = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div style={{ position: 'relative', background: 'transparent', minHeight: '100vh', width: '100%', paddingBottom: '45px', paddingTop: '45px', overflowX: 'hidden' }}>
      
      {/* Top Ticker Marquee */}
      <div className="marquee-container">
        <div className="marquee-content">
          <span>SUKHOI CHAIN LAUNCHPAD IS ACTIVE • 1 SKH = 2,500 USDT • 0.1 SKH MEMO FEE PERMANENTLY BURNED • AUDIT SECURED • </span>
          <span>SUKHOI CHAIN LAUNCHPAD IS ACTIVE • 1 SKH = 2,500 USDT • 0.1 SKH MEMO FEE PERMANENTLY BURNED • AUDIT SECURED • </span>
          <span>SUKHOI CHAIN LAUNCHPAD IS ACTIVE • 1 SKH = 2,500 USDT • 0.1 SKH MEMO FEE PERMANENTLY BURNED • AUDIT SECURED • </span>
        </div>
      </div>

      <div className="container" style={{ marginTop: '20px' }}>
        
        {/* Project Hero Title */}
        <div className="project-hero" style={{ marginBottom: '16px' }}>
          <h1 className="cyber-glow-text" style={{ fontSize: '2.8rem' }}>SUKHOI CHAIN</h1>
          <p className="cyber-subtitle" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            BREAK FREE. TAKE CONTROL. JOIN THE DEFLATIONARY MOVEMENT.
          </p>
        </div>

        {/* Main Grid split */}
        <div className="launchpad-layout-grid" style={{ gap: '20px' }}>
          
          {/* Left Panel: Token Details and Mission */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* System Info OS Window */}
            <div className="cyber-window">
              <div className="cyber-window-header">
                <span className="window-title">SYSTEM_STATUS.LOG</span>
                <div className="window-controls">
                  <span>[_]</span> <span>[X]</span>
                </div>
              </div>
              <div className="cyber-window-body" style={{ padding: '16px' }}>
                <p style={{ color: '#00E676', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.85rem' }}>● ALL CORE PROTOCOLS SECURITY AUDITED [PASS]</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.5' }}>
                  Sukhoi Chain operates as a private, high-speed EVM-equivalent ledger. Mnemonic phrases and private keys remain strictly browser-local. Transaction fees (0.1 SKH per memo) are automatically burned by the token smart contract, reducing the total supply over time.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                  <div>
                    <span className="hud-mini-label">CHAIN ID</span>
                    <span className="hud-mono-val" style={{ fontSize: '1rem' }}>19735</span>
                  </div>
                  <div>
                    <span className="hud-mini-label">ACTIVE BLOCKS</span>
                    <span className="hud-mono-val" style={{ color: '#0052FF', fontSize: '1rem' }}>#{latestBlock !== null ? latestBlock : '---'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manifesto Windows (No Scroll) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Window: Security Audit */}
              <div className="cyber-window" style={{ margin: 0 }}>
                <div className="cyber-window-header">
                  <span className="window-title">SECURITY_AUDIT.LOG</span>
                  <div className="window-controls">
                    <span>[_]</span> <span>[X]</span>
                  </div>
                </div>
                <div className="cyber-window-body" style={{ padding: '12px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  <p style={{ color: '#00E676', fontWeight: 'bold', marginBottom: '4px' }}>[CYBERSECURITY CLEARANCE LEVEL 5]</p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Sukhoi Chain has undergone rigorous penetration testing by independent cybersecurity experts. Our EVM-equivalent node architecture ensures zero vulnerabilities in memo encryption.
                  </p>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                    <strong style={{color: '#FFFFFF'}}>KEY FEATURES:</strong> Zero backend data retention, isolated browser-local signing, cryptographic hashing of all payloads, and permanent 0.1 SKH fee burning.
                  </p>
                </div>
              </div>

              {/* Window: Whitepaper */}
              <div className="cyber-window" style={{ margin: 0 }}>
                <div className="cyber-window-header">
                  <span className="window-title">WHITEPAPER_V1.PDF</span>
                  <div className="window-controls">
                    <span>[_]</span> <span>[X]</span>
                  </div>
                </div>
                <div className="cyber-window-body" style={{ padding: '12px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  <p style={{ color: '#FFFFFF', fontWeight: 'bold', marginBottom: '4px' }}>Decentralized Documentation</p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Access the complete technical manifesto detailing the mathematical proofs behind our deflationary tokenomics and EVM compatibility layer.
                  </p>
                  <button className="cyber-btn" style={{ marginTop: '10px', fontSize: '0.7rem', padding: '6px 12px' }}>
                    DOWNLOAD ENCRYPTED PDF
                  </button>
                </div>
              </div>
              
              {/* Window 1: Mission */}
              <div className="cyber-window" style={{ margin: 0 }}>
                <div className="cyber-window-header">
                  <span className="window-title">MISSION_STATEMENT.TXT</span>
                  <div className="window-controls">
                    <span>[_]</span> <span>[X]</span>
                  </div>
                </div>
                <div className="cyber-window-body" style={{ padding: '12px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  <p style={{ color: '#FFFFFF', fontWeight: 'bold', marginBottom: '4px' }}>Why Sukhoi Chain Emerge?</p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Sukhoi Chain emerged to break the constraints of public EVM ledgers. Traditional networks impose astronomical gas costs and completely expose transaction descriptions to the public. 
                  </p>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Sukhoi is designed as a high-speed, private EVM-equivalent network that natively secures memos via contract-level cryptographic hashing. For every message attached, a transaction fee of 0.1 SKH is permanently burned, making it a highly deflationary utility ledger.
                  </p>
                </div>
              </div>

              {/* Window: Tokenomics & Goals */}
              <div className="cyber-window" style={{ marginTop: '0px', margin: 0 }}>
                <div className="cyber-window-header">
                  <span className="window-title">BUDGET_ALLOCATION.SYS</span>
                  <div className="window-controls">
                    <span>[_]</span> <span>[X]</span>
                  </div>
                </div>
                <div className="cyber-window-body" style={{ padding: '12px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  <p style={{ color: '#FFFFFF', fontWeight: 'bold', marginBottom: '6px' }}>Our Goals & Budget Utilization</p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Budget raised during the presale is locked entirely in smart contracts to support liquidity and protocol growth. 
                  </p>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <strong>50%</strong> DEX liquidity locking, <strong>30%</strong> developer grants for L2 infrastructure, and <strong>20%</strong> to security auditing firms.
                  </p>
                  
                  <div className="tokenomics-capsules-grid" style={{ gap: '6px', margin: '10px 0 8px 0' }}>
                    <div className="tokenomics-pill" style={{ padding: '4px 6px' }}>
                      <span className="pill-label">MAX SUPPLY</span>
                      <span className="pill-value" style={{ fontSize: '0.7rem' }}>500 SKH</span>
                    </div>
                    <div className="tokenomics-pill" style={{ padding: '4px 6px' }}>
                      <span className="pill-label">MEMO FEE</span>
                      <span className="pill-value" style={{ fontSize: '0.7rem' }}>0.1 SKH</span>
                    </div>
                  </div>

                  {/* Allocation Progress Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
                        <span>Presale Allocation (40%)</span>
                        <span className="mono">200 SKH</span>
                      </div>
                      <div className="cyber-progress-bg" style={{ height: '6px' }}>
                        <div className="cyber-progress-fill" style={{ width: '40%', background: '#0052FF' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
                        <span>Ecosystem Reserve (30%)</span>
                        <span className="mono">150 SKH</span>
                      </div>
                      <div className="cyber-progress-bg" style={{ height: '6px' }}>
                        <div className="cyber-progress-fill" style={{ width: '30%', background: '#00A3FF' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Right Panel: Buy/Sell Swap Widget & Wallet gateway */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            


            {/* Wallet Onboarding Gateway OS Window */}
            <div className="cyber-window">
              <div className="cyber-window-header">
                <span className="window-title">WALLET_GATEWAY_TERMINAL.EXE</span>
                <div className="window-controls">
                  <span>[_]</span> <span>[X]</span>
                </div>
              </div>
              <div className="cyber-window-body" style={{ padding: '16px' }}>
                
                {address ? (
                  /* WALLET CONNECTED VIEW */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ background: 'rgba(0, 82, 255, 0.05)', border: '1px solid var(--border)', padding: '8px', borderLeft: '4px solid #0052FF' }}>
                      <span style={{ fontSize: '0.65rem', color: '#AAAAAA', display: 'block', textTransform: 'uppercase' }}>Connected Wallet</span>
                      <span className="mono" style={{ fontSize: '0.8rem', color: '#FFFFFF', wordBreak: 'break-all', display: 'block', fontWeight: 'bold', marginTop: '2px' }}>
                        {address}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={navigateToDashboard} className="cyber-btn cyber-btn-primary" style={{ flex: 1, padding: '8px' }}>
                        ACCESS DASHBOARD
                      </button>
                      <button onClick={handleDisconnect} className="cyber-btn" style={{ width: '100px', padding: '8px', borderColor: 'var(--error)', color: 'var(--error)' }}>
                        DISCONNECT
                      </button>
                    </div>
                  </div>
                ) : (
                  /* GUEST GATEWAY FLOWS */
                  <div>
                    {/* Navigation tabs inside terminal */}
                    <div className="gateway-tabs">
                      <button 
                        type="button" 
                        onClick={() => { setFlowState('create'); setCreated(false); setConfirmed(false); }} 
                        className={`gateway-tab ${flowState === 'create' ? 'active' : ''}`}
                        style={{ padding: '6px' }}
                      >
                        CREATE NEW WALLET
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setFlowState('recover'); setRecoverError(''); setRecoverPhrase(''); }} 
                        className={`gateway-tab ${flowState === 'recover' ? 'active' : ''}`}
                        style={{ padding: '6px' }}
                      >
                        IMPORT SEED PHRASE
                      </button>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      {flowState === 'landing' && (
                        <div style={{ textAlign: 'center', padding: '8px 0' }}>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>
                            Access the private Sukhoi Chain network. Create a new encrypted HD wallet keypair or import your existing 12-word mnemonic phrase.
                          </p>
                          <button onClick={() => setFlowState('create')} className="cyber-btn cyber-btn-primary" style={{ width: '100%', padding: '10px' }}>
                            GENERATE WALLET ADDRESS
                          </button>
                        </div>
                      )}

                      {/* CREATE FLOW */}
                      {flowState === 'create' && (
                        <div>
                          {!created ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Clicking the button below generates a unique, browser-secured 12-word recovery phrase. Make sure you are in a private environment.
                              </p>
                              {createLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 0' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                                    <span style={{ color: '#00E676' }}>GATHERING ENTROPY...</span>
                                    <span style={{ color: '#00E676' }}>{Math.round(createProgress)}%</span>
                                  </div>
                                  <div className="cyber-progress-bg" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                                    <div className="cyber-progress-fill" style={{ width: `${createProgress}%`, height: '100%', background: '#0052FF', transition: 'width 0.05s ease-out' }}></div>
                                  </div>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                                    SECURELY DERIVING CRYPTOGRAPHIC KEYPAIR...
                                  </span>
                                </div>
                              ) : (
                                <button 
                                  onClick={handleCreateWallet} 
                                  className="cyber-btn cyber-btn-primary"
                                  disabled={createLoading}
                                  style={{ width: '100%', padding: '10px' }}
                                >
                                  GENERATE NEW SEED
                                </button>
                              )}
                              {createError && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px', textAlign: 'center', fontWeight: 'bold' }}>{createError}</p>}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div className="security-notice-box" style={{ padding: '8px' }}>
                                <strong>CRITICAL SECURITY WARNING:</strong>
                                <p style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                                  Write down these 12 words on physical paper. Do NOT store them digitally. This is your ONLY account recovery method.
                                </p>
                              </div>

                              {/* 12-Word Mnemonic Display */}
                              <div style={{ position: 'relative' }}>
                                <div className="retro-mnemonic-grid" style={{ padding: '8px', gap: '6px' }}>
                                  {generatedMnemonic ? generatedMnemonic.split(' ').map((word, idx) => (
                                    <div key={idx} className="retro-word-badge" style={{ padding: '4px 6px' }}>
                                      <span className="word-idx">{idx + 1}.</span>
                                      <span className="word-txt">{word}</span>
                                    </div>
                                  )) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', gridColumn: 'span 3', textAlign: 'center' }}>
                                      No mnemonic phrase generated. Try again.
                                    </span>
                                  )}
                                </div>
                                {generatedMnemonic && (
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(generatedMnemonic);
                                      setCopiedMnemonic(true);
                                      setTimeout(() => setCopiedMnemonic(false), 2000);
                                    }} 
                                    className="cyber-btn" 
                                    style={{ width: '100%', padding: '6px', fontSize: '0.75rem', marginTop: '6px', borderColor: copiedMnemonic ? '#00c2ff' : '#444', color: copiedMnemonic ? '#00c2ff' : '#fff' }}
                                  >
                                    {copiedMnemonic ? "COPIED TO CLIPBOARD!" : "COPY SEED PHRASE"}
                                  </button>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '6px' }}>
                                <input 
                                  type="checkbox" 
                                  id="landing-confirm"
                                  checked={confirmed}
                                  disabled={connectLoading}
                                  onChange={(e) => setConfirmed(e.target.checked)}
                                  style={{ marginTop: '2px' }}
                                />
                                <label htmlFor="landing-confirm" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                  I have copied and stored my seed phrase securely.
                                </label>
                              </div>

                              <button 
                                onClick={handleConnectCreatedWallet}
                                className="cyber-btn cyber-btn-primary"
                                disabled={!confirmed || connectLoading}
                                style={{ width: '100%', padding: '10px' }}
                              >
                                {connectLoading ? 'CONNECTING & GOING TO DASHBOARD...' : 'CONNECT & GO TO DASHBOARD'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* IMPORT FLOW */}
                      {flowState === 'recover' && (
                        <form onSubmit={handleRecoverSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                              ENTER 12-WORD MNEMONIC
                            </label>
                            <textarea 
                              className="cyber-textarea"
                              rows={2}
                              placeholder="word1 word2 word3..."
                              value={recoverPhrase}
                              disabled={connectLoading}
                              onChange={(e) => setRecoverPhrase(e.target.value.replace(/\s+/g, ' '))}
                              required
                            />
                          </div>

                          {recoverError && (
                            <div className="form-feedback error" style={{ padding: '6px' }}>
                              {recoverError}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" className="cyber-btn cyber-btn-primary" disabled={connectLoading} style={{ flex: 1, padding: '10px' }}>
                              {connectLoading ? 'CONNECTING...' : 'CONNECT WALLET'}
                            </button>
                            <button type="button" onClick={() => setFlowState('landing')} disabled={connectLoading} className="cyber-btn" style={{ width: '80px', padding: '10px' }}>
                              CANCEL
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Presale Stats & Metrics Monitor OS Window */}
            <div className="cyber-window window-glowing" style={{ marginTop: '12px' }}>
              <div className="cyber-window-header header-glow">
                <span className="window-title">LAUNCHPAD_METRICS.SYS</span>
                <div className="window-controls">
                  <span>[_]</span> <span>[X]</span>
                </div>
              </div>
              <div className="cyber-window-body" style={{ padding: '16px' }}>
                
                {/* Presale Countdown */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.65rem', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PRESALE ENDS IN</span>
                  <div className="countdown-timer-row" style={{ gap: '6px', marginTop: '4px', justifyContent: 'center' }}>
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

                {/* Progress bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>USDT CONTRIBUTED</span>
                    <span className="mono" style={{ color: '#0052FF' }}>$1,245,670 / $2,500,000</span>
                  </div>
                  <div className="cyber-progress-bg" style={{ height: '10px' }}>
                    <div className="cyber-progress-fill" style={{ width: '49.8%', background: '#0052FF', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.15) 10px, rgba(255,255,255,0.15) 20px)' }}></div>
                  </div>
                </div>

                {/* Price alert */}
                <div className="presale-price-bar" style={{ padding: '8px 12px', marginBottom: '12px' }}>
                  <span>ACTIVE SWAP RATE:</span>
                  <span className="price-tag">1 SKH = 2,500 USDT</span>
                </div>

                {/* Additional Network Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginTop: '10px' }}>
                  <div>
                    <span className="hud-mini-label" style={{ fontSize: '0.6rem' }}>TOTAL SUPPLY LIMIT</span>
                    <span className="hud-mono-val" style={{ fontSize: '0.9rem', color: '#FFFFFF' }}>500 SKH</span>
                  </div>
                  <div>
                    <span className="hud-mini-label" style={{ fontSize: '0.6rem' }}>PREMINED RESERVE</span>
                    <span className="hud-mono-val" style={{ fontSize: '0.9rem', color: '#00C2FF' }}>300 SKH</span>
                  </div>
                  <div>
                    <span className="hud-mini-label" style={{ fontSize: '0.6rem' }}>EVM SECURE GAS</span>
                    <span className="hud-mono-val" style={{ fontSize: '0.9rem', color: '#00E676' }}>0.0001 GWEI</span>
                  </div>
                  <div>
                    <span className="hud-mini-label" style={{ fontSize: '0.6rem' }}>BURN RATE</span>
                    <span className="hud-mono-val" style={{ fontSize: '0.9rem', color: '#FF3D00' }}>0.1 SKH / TX</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Window: Team */}
            <div className="cyber-window" style={{ marginTop: '0px' }}>
              <div className="cyber-window-header">
                <span className="window-title">THE_TEAM.TXT</span>
                <div className="window-controls">
                  <span>[_]</span> <span>[X]</span>
                </div>
              </div>
              <div className="cyber-window-body" style={{ padding: '12px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                <p style={{ color: '#FFFFFF', fontWeight: 'bold', marginBottom: '4px' }}>Who is Behind the Project?</p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Sukhoi Chain is developed and maintained by Sukhoi Protocol Labs, a decentralized collective of cryptographers, network engineers, and anonymous cybersecurity researchers.
                </p>
                <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                  The team is dedicated to building sovereign financial software with zero backend data retention, enforcing complete browser-local signing protocol. Private keys and mnemonics never leave your device.
                </p>
              </div>
            </div>

            {/* Window: Roadmap */}
            <div className="cyber-window" style={{ marginTop: '0px' }}>
              <div className="cyber-window-header">
                <span className="window-title">ROADMAP_STAGES.CFG</span>
                <div className="window-controls">
                  <span>[_]</span> <span>[X]</span>
                </div>
              </div>
              <div className="cyber-window-body" style={{ padding: '12px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                <p style={{ color: '#FFFFFF', fontWeight: 'bold', marginBottom: '6px' }}>Project Milestones & Stage Pricing</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                    <span>Phase 1: Private Testnet Launch</span>
                    <span style={{ color: '#00E676' }}>[Completed]</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                    <span>Phase 2: Presale & Liquidity Lock</span>
                    <span style={{ color: '#00C2FF' }}>[Active - 1 SKH = 2,500 USDT]</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                    <span>Phase 3: TGE & Uniswap DEX Listing</span>
                    <span>[Target: 1 SKH = 3,000 USDT]</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                    <span>Phase 4: Sukhoi EVM Bridge & L2 Release</span>
                    <span>[Mainnet Integration]</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2px' }}>
                    <span>Phase 5: Cross-chain Expansion & DAO</span>
                    <span>[Governance Release]</span>
                  </div>
                </div>
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

export default Landing;
