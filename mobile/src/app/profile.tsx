import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Switch, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { securityLockService } from '@/components/security-lock';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  chaplain: 'Chaplain',
  chapel_leader: 'Chapel Leader',
  member: 'Member',
};

export default function ProfileScreen() {
  const { user, isAnonymous, logout } = useAuth();
  const [lockEnabled, setLockEnabled] = useState(false);
  const [pinSetupVisible, setPinSetupVisible] = useState(false);
  const [setupStep, setSetupStep] = useState<'enter' | 'confirm' | 'verify_disable'>('enter');
  const [tempPin, setTempPin] = useState('');
  const [profileError, setProfileError] = useState('');
  const role = user?.role || 'member';
  const roleLabel = roleLabels[role] || 'Member';
  const isChaplain = role === 'chaplain';
  const isChapelLeader = role === 'chapel_leader';

  // Load security settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const enabled = await securityLockService.isEnabled();
      setLockEnabled(enabled);
    };
    loadSettings();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleToggleLock = async (value: boolean) => {
    if (value) {
      const existingPin = await securityLockService.getPin();
      if (existingPin) {
        await securityLockService.setEnabled(true);
        setLockEnabled(true);
      } else {
        setSetupStep('enter');
        setTempPin('');
        setProfileError('');
        setPinSetupVisible(true);
      }
    } else {
      setSetupStep('verify_disable');
      setTempPin('');
      setProfileError('');
      setPinSetupVisible(true);
    }
  };

  const handlePinSubmit = async (val: string) => {
    if (val.length !== 4 || isNaN(Number(val))) {
      setProfileError('Passcode must be 4 numbers');
      return;
    }

    if (setupStep === 'enter') {
      setTempPin(val);
      setSetupStep('confirm');
      setProfileError('');
    } else if (setupStep === 'confirm') {
      if (val !== tempPin) {
        setProfileError('Passcodes do not match');
        return;
      }
      await securityLockService.setPin(val);
      await securityLockService.setEnabled(true);
      setLockEnabled(true);
      setPinSetupVisible(false);
    } else if (setupStep === 'verify_disable') {
      const storedPin = await securityLockService.getPin();
      if (val !== storedPin) {
        setProfileError('Incorrect passcode');
        return;
      }
      await securityLockService.setEnabled(false);
      setLockEnabled(false);
      setPinSetupVisible(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>My Profile</ThemedText>
            <ThemedText style={styles.subtitle} themeColor="textSecondary">
              Manage your Chapel System account settings.
            </ThemedText>
          </View>

          {isAnonymous ? (
            <View style={styles.anonymousCard}>
              <ThemedText type="smallBold" style={styles.anonymousTitle}>Guest Account</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.anonymousText}>
                You are currently browsing the app anonymously. Some features like booking history, personalized announcements, and event registrations are only available to logged-in members.
              </ThemedText>
              <TouchableOpacity style={styles.loginButton} onPress={handleLogout}>
                <ThemedText type="smallBold" style={styles.buttonText}>Sign In / Register</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.profileHeader}>
                <View style={[styles.avatar, isChaplain && styles.chaplainAvatar, isChapelLeader && styles.leaderAvatar]}>
                  <ThemedText type="subtitle" style={styles.avatarText}>
                    {user?.firstName?.[0] || 'U'}
                  </ThemedText>
                </View>
                <View style={styles.nameContainer}>
                  <ThemedText type="smallBold" style={styles.fullName}>
                    {user?.firstName} {user?.lastName}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={[styles.roleText, isChaplain && styles.chaplainRoleText, isChapelLeader && styles.leaderRoleText]}
                  >
                    {roleLabel.toUpperCase()}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <ThemedText type="smallBold" style={styles.infoLabel}>Email Address</ThemedText>
                <ThemedText type="small" style={styles.infoValue}>{user?.email}</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText type="smallBold" style={styles.infoLabel}>Phone Number</ThemedText>
                <ThemedText type="small" style={styles.infoValue}>{user?.phoneNumber || 'Not provided'}</ThemedText>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <ThemedText type="smallBold" style={styles.logoutButtonText}>Log Out</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Premium App Security settings card */}
          <View style={styles.card}>
            <ThemedText type="smallBold" style={styles.securityTitle}>App Security</ThemedText>
            <View style={styles.securityRow}>
              <View style={styles.securityLabelContainer}>
                <ThemedText type="smallBold" style={styles.securityLabel}>Security Passcode Lock</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.securityDescription}>
                  Require a 4-digit PIN on app startup.
                </ThemedText>
              </View>
              <Switch
                value={lockEnabled}
                onValueChange={handleToggleLock}
                trackColor={{ false: '#315f72', true: '#2f7d46' }}
                thumbColor={lockEnabled ? '#9bd8aa' : '#b0b4ba'}
              />
            </View>
          </View>

          <View style={styles.infoCard}>
            <ThemedText type="smallBold" style={styles.infoTitle}>About Chapel System</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
              Version 1.0.0 (Expo + React Native){'\n'}
              Connected to Chapel System Management Cloud Server.
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* PIN configuration modal */}
      <Modal visible={pinSetupVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {setupStep === 'enter' && 'Set Security Passcode'}
              {setupStep === 'confirm' && 'Confirm Security Passcode'}
              {setupStep === 'verify_disable' && 'Verify Passcode'}
            </ThemedText>

            <ThemedText type="small" themeColor="textSecondary" style={styles.modalSubtitle}>
              {setupStep === 'enter' && 'Create a 4-digit security code to lock Chapel System.'}
              {setupStep === 'confirm' && 'Re-enter your 4-digit passcode to confirm.'}
              {setupStep === 'verify_disable' && 'Enter your current 4-digit passcode to disable lock.'}
            </ThemedText>

            {profileError ? (
              <ThemedText style={styles.modalError}>{profileError}</ThemedText>
            ) : null}

            <TextInput
              style={styles.pinInput}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              autoFocus
              placeholder="••••"
              placeholderTextColor="rgba(255,255,255,0.2)"
              onChangeText={(text) => {
                if (text.length === 4) {
                  handlePinSubmit(text);
                }
              }}
            />

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setPinSetupVisible(false)}
            >
              <ThemedText type="smallBold" style={styles.cancelText}>Cancel</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10161c',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    marginVertical: Spacing.four,
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: Spacing.two,
    fontWeight: '800',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: Spacing.four,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2f7d46',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  chaplainAvatar: {
    backgroundColor: '#315f72',
  },
  leaderAvatar: {
    backgroundColor: '#8a6225',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  nameContainer: {
    justifyContent: 'center',
  },
  fullName: {
    fontSize: 20,
    color: '#ffffff',
  },
  roleText: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#9bd8aa',
  },
  chaplainRoleText: {
    color: '#d8c690',
  },
  leaderRoleText: {
    color: '#d6a650',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: Spacing.three,
  },
  infoRow: {
    marginBottom: Spacing.three,
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: 'rgba(194, 65, 58, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(194, 65, 58, 0.3)',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  logoutButtonText: {
    color: '#ffcdd2',
  },
  anonymousCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: Spacing.four,
  },
  anonymousTitle: {
    color: '#d6a650',
    fontSize: 18,
    marginBottom: Spacing.two,
  },
  anonymousText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.four,
  },
  loginButton: {
    backgroundColor: '#2f7d46',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
  securityTitle: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  securityLabelContainer: {
    flex: 1,
    marginRight: Spacing.three,
  },
  securityLabel: {
    color: '#ffffff',
    fontSize: 15,
  },
  securityDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoTitle: {
    color: '#9bd8aa',
    marginBottom: Spacing.one,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#10161c',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  modalSubtitle: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.four,
  },
  modalError: {
    color: '#c2413a',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  pinInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    color: '#ffffff',
    fontSize: 24,
    textAlign: 'center',
    width: 140,
    letterSpacing: 8,
    marginBottom: Spacing.four,
  },
  cancelButton: {
    paddingVertical: Spacing.two,
  },
  cancelText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
});
