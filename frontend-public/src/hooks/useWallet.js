import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export function useWallet() {
  const [address, setAddress] = useState(() => localStorage.getItem('sukhoi_wallet_address') || null);
  const [balance, setBalance] = useState('0.0');
  const [mnemonic, setMnemonic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Refresh balance and transactions list
  const refreshBalance = useCallback(async (walletAddress = address) => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWallet(walletAddress);
      if (data.success) {
        setBalance(data.balance);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load wallet data:', err);
      setError(err.message || 'Failed to refresh balance');
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Load wallet on mount
  useEffect(() => {
    if (address) {
      refreshBalance(address);
    }
  }, [address, refreshBalance]);

  // Create new wallet
  const createWallet = async () => {
    setLoading(true);
    setError(null);
    setMnemonic(null);
    try {
      const data = await api.createWallet();
      if (data.success) {
        setMnemonic(data.mnemonic);
        return data;
      }
    } catch (err) {
      setError(err.message || 'Wallet creation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Recover wallet from seed phrase
  const recoverWallet = async (seedPhrase) => {
    setLoading(true);
    setError(null);
    setMnemonic(null);
    try {
      const data = await api.recoverWallet(seedPhrase);
      if (data.success) {
        setAddress(data.address);
        localStorage.setItem('sukhoi_wallet_address', data.address);
        await refreshBalance(data.address);
        return data;
      }
    } catch (err) {
      setError(err.message || 'Wallet recovery failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout wallet
  const logout = () => {
    setAddress(null);
    setBalance('0.0');
    setMnemonic(null);
    setTransactions([]);
    setError(null);
    localStorage.removeItem('sukhoi_wallet_address');
  };

  return {
    address,
    balance,
    mnemonic,
    loading,
    error,
    transactions,
    createWallet,
    recoverWallet,
    logout,
    refreshBalance
  };
}
