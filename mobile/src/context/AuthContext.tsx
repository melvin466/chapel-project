import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';

interface AuthContextType {
  user: any | null;
  isAnonymous: boolean;
  loading: boolean;
  login: (user: any) => void;
  logout: () => Promise<void>;
  setAnonymous: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedUser = await authService.getCurrentUser();
        const token = await AsyncStorage.getItem('token');
        if (storedUser && token) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = (userData: any) => {
    setUser(userData);
    setIsAnonymous(false);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAnonymous(false);
  };

  const setAnonymous = (value: boolean) => {
    setIsAnonymous(value);
  };

  return (
    <AuthContext.Provider value={{ user, isAnonymous, loading, login, logout, setAnonymous }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
