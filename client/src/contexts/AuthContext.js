import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        if (authData.email && authData.timestamp) {
          // Check if login is still valid (24 hours)
          const now = Date.now();
          const loginTime = authData.timestamp;
          const twentyFourHours = 24 * 60 * 60 * 1000;
          
          if (now - loginTime < twentyFourHours) {
            setIsAuthenticated(true);
            setUser({ email: authData.email });
          } else {
            // Login expired, clear it
            localStorage.removeItem('admin_auth');
          }
        }
      } catch (error) {
        console.error('Error parsing saved auth:', error);
        localStorage.removeItem('admin_auth');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/admin/login', {
        email,
        password
      });

      if (response.data.success) {
        const authData = {
          email,
          token: response.data.token,
          timestamp: Date.now()
        };
        
        localStorage.setItem('admin_auth', JSON.stringify(authData));
        setIsAuthenticated(true);
        setUser({ email, token: response.data.token });
        return { success: true };
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
