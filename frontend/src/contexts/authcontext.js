import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import api from '../utils/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Failed to load user:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token: newToken, user: newUser } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      
      toast.success('Registration successful! Please verify your phone.');
      return { success: true, requiresVerification: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token: newToken, user: newUser } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  // Verify phone
  const verifyPhone = async (code) => {
    try {
      await api.post('/auth/verify-phone', { code });
      
      // Reload user to get updated verification status
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      
      toast.success('Phone verified successfully!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (data) => {
    try {
      const response = await api.put('/users/profile', data);
      setUser(response.data.user);
      toast.success('Profile updated successfully');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Update failed');
      throw error;
    }
  };

  // Change password
  const changePassword = async (data) => {
    try {
      await api.put('/auth/change-password', data);
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Password change failed');
      throw error;
    }
  };

  // Set transaction PIN
  const setPin = async (pin, confirmPin) => {
    try {
      await api.put('/auth/set-pin', { pin, confirmPin });
      toast.success('Transaction PIN set successfully');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to set PIN');
      throw error;
    }
  };

  // Forgot password
  const forgotPassword = async (phone) => {
    try {
      await api.post('/auth/forgot-password', { phone });
      toast.success('Reset code sent to your phone');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reset code');
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      toast.success('Password reset successful');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Password reset failed');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    token,
    register,
    login,
    verifyPhone,
    logout,
    updateProfile,
    changePassword,
    setPin,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isVerified: user?.isVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
