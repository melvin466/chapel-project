import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, ActivityIndicator, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoginScreen from '@/screens/LoginScreen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { SecurityLockOverlay, securityLockService } from '@/components/security-lock';
import OfflineBanner from '@/components/offline-banner';

function AppContent() {
  const { user, isAnonymous, loading, login, setAnonymous } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(true);

  useEffect(() => {
    const checkLockState = async () => {
      try {
        const enabled = await securityLockService.isEnabled();
        const pin = await securityLockService.getPin();
        setIsLocked(enabled && pin !== null);
      } catch (e) {
        console.error('Error checking lock state:', e);
      } finally {
        setCheckingLock(false);
      }
    };
    checkLockState();
  }, []);

  if (loading || checkingLock) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10161c' }}>
        <ActivityIndicator size="large" color="#2f7d46" />
      </View>
    );
  }

  if (isLocked) {
    return <SecurityLockOverlay onUnlock={() => setIsLocked(false)} />;
  }

  if (!user && !isAnonymous) {
    return (
      <LoginScreen
        onLoginSuccess={login}
        onAnonymousAccess={() => setAnonymous(true)}
      />
    );
  }

  return <AppTabs />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <OfflineBanner />
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
