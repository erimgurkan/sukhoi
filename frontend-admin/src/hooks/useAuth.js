import { useState, useEffect } from 'react';
import * as api from '../services/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => api.isAuthenticated());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial authorization state
    setIsAuthenticated(api.isAuthenticated());
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await api.login(username, password);
      if (data.success) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    loading,
    login,
    logout
  };
}
