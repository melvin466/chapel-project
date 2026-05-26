import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      authService.getMe()
        .then((response) => {
          const freshUser = response.data?.user;
          if (freshUser) setUser(freshUser);
        })
        .catch(() => {
          // Keep the restored local user unless the API explicitly clears the token.
        });
    } else {
      authService.logout();
    }
    setLoading(false);
  }, []);

  const refreshUser = async () => {
    const response = await authService.getMe();
    const freshUser = response.data?.user;
    if (freshUser) setUser(freshUser);
    return freshUser;
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        setUser(response.data?.user || response.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message, status: error.status };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        const loggedInUser = response.data?.user || response.user;
        setUser(loggedInUser);
        return { success: true, user: loggedInUser };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await authService.verifyEmail(token);
      if (response.success) {
        const verifiedUser = response.data?.user || response.user;
        if (verifiedUser) setUser(verifiedUser);
        return { success: true, user: verifiedUser, message: response.message };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Could not verify this email link.' };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        const updatedUser = response.data?.user || response.user;
        setUser(updatedUser);
        return { success: true, user: updatedUser };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Profile update failed' };
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    verifyEmail,
    logout,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isChaplain: user?.role === 'chaplain'  // ← ADD THIS LINE
  };

  return (
    <AuthContext.Provider value={value}>
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
