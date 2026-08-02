import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Ensure Axios sends credentials (session cookies) for all requests
axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null); // { message, type: 'error' | 'success' | 'info' }

  const showFlash = (message, type = 'error') => {
    setFlash({ message, type });
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setFlash(prev => prev && prev.message === message ? null : prev);
    }, 5000);
  };

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/status');
      if (response.data.isAuthenticated) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (username, password, remember) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password, remember });
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        showFlash('Logged in successfully.', 'success');
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Login failed.' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      showFlash('You have been logged out successfully.', 'success');
    } catch (error) {
      showFlash('Logout failed.', 'error');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, flash, showFlash, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
