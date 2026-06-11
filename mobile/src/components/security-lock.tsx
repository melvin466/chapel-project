import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Spacing } from '@/constants/theme';

const PIN_LENGTH = 4;
const PIN_KEY = '@chapel_security:pin';
const LOCK_ENABLED_KEY = '@chapel_security:enabled';

export const securityLockService = {
  isEnabled: async (): Promise<boolean> => {
    try {
      const val = await AsyncStorage.getItem(LOCK_ENABLED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },
  setEnabled: async (enabled: boolean): Promise<void> => {
    try {
      await AsyncStorage.setItem(LOCK_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
  },
  getPin: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(PIN_KEY);
    } catch {
      return null;
    }
  },
  setPin: async (pin: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(PIN_KEY, pin);
    } catch (e) {
      console.error(e);
    }
  },
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(PIN_KEY);
      await AsyncStorage.removeItem(LOCK_ENABLED_KEY);
    } catch (e) {
      console.error(e);
    }
  }
};

interface SecurityLockOverlayProps {
  onUnlock: () => void;
}

export function SecurityLockOverlay({ onUnlock }: SecurityLockOverlayProps) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = async (num: string) => {
    if (pin.length >= PIN_LENGTH) return;
    setErrorMsg('');
    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      const storedPin = await securityLockService.getPin();
      if (storedPin === newPin) {
        onUnlock();
      } else {
        triggerShake();
        setErrorMsg('Incorrect Passcode');
        setTimeout(() => setPin(''), 500);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg('');
    }
  };

  const renderDot = (index: number) => {
    const isFilled = pin.length > index;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          isFilled && styles.dotFilled,
          errorMsg !== '' && isFilled && styles.dotError,
        ]}
      />
    );
  };

  const renderKey = (val: string) => {
    return (
      <TouchableOpacity key={val} style={styles.keyButton} onPress={() => handleKeyPress(val)}>
        <ThemedText style={styles.keyText}>{val}</ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>Chapel System</ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">App Locked</ThemedText>
      </View>

      <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => renderDot(i))}
      </Animated.View>

      {errorMsg ? (
        <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
      ) : (
        <View style={styles.errorPlaceholder} />
      )}

      <View style={styles.keypad}>
        <View style={styles.keyRow}>
          {['1', '2', '3'].map(renderKey)}
        </View>
        <View style={styles.keyRow}>
          {['4', '5', '6'].map(renderKey)}
        </View>
        <View style={styles.keyRow}>
          {['7', '8', '9'].map(renderKey)}
        </View>
        <View style={styles.keyRow}>
          <View style={styles.emptyKey} />
          {renderKey('0')}
          <TouchableOpacity style={styles.keyButton} onPress={handleBackspace}>
            <ThemedText style={styles.backspaceText}>⌫</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#10161c',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 24,
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
    letterSpacing: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginVertical: Spacing.four,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 12,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#2f7d46',
    borderColor: '#9bd8aa',
  },
  dotError: {
    backgroundColor: '#c2413a',
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c2413a',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.four,
  },
  errorPlaceholder: {
    height: 20,
    marginBottom: Spacing.four,
  },
  keypad: {
    width: '80%',
    maxWidth: 300,
    marginTop: Spacing.two,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  keyButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyKey: {
    width: 65,
    height: 65,
  },
  backspaceText: {
    fontSize: 20,
    color: '#ffffff',
  },
});

export default SecurityLockOverlay;
