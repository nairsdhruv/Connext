import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('connext_token'));
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount if token exists
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('connext_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data.user) {
          setUser(res.data.user);
          connectSocket();
        }
      } catch (err) {
        console.warn('[AuthContext] Session verification failed:', err.response?.data?.message || err.message);
        localStorage.removeItem('connext_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('connext_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      connectSocket();
      return receivedUser;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (displayName, email, password, bio) => {
    const res = await api.post('/auth/register', { displayName, email, password, bio });
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('connext_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      connectSocket();
      return receivedUser;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors during logout
    }
    localStorage.removeItem('connext_token');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const updateProfile = async (profileData) => {
    const res = await api.patch('/auth/profile', profileData);
    if (res.data?.success && res.data.user) {
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data?.message || 'Could not update profile');
  };

  const deleteAccount = async () => {
    const res = await api.delete('/auth/account');
    if (res.data?.success) {
      localStorage.removeItem('connext_token');
      setToken(null);
      setUser(null);
      disconnectSocket();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        deleteAccount
      }}
    >
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
