import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Picker } from '@react-native-picker/picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import donationService from '../services/donationService';
import { useAuth } from '@/context/AuthContext';

const donationOptions = [
  { id: 'tithe', name: 'Tithe' },
  { id: 'offering', name: 'Offering' },
  { id: 'pledge', name: 'Pledge' },
  { id: 'building', name: 'Building Fund' },
  { id: 'missions', name: 'Missions' },
  { id: 'benevolence', name: 'Benevolence' },
];

export default function GiveScreen() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [donationType, setDonationType] = useState('tithe');
  const [provider, setProvider] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string | React.ReactNode } | null>(null);

  useEffect(() => {
    if (user?.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
    }
  }, [user]);

  const handleGive = async () => {
    setStatusMessage(null);
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount < 500) {
      setStatusMessage({ type: 'error', text: 'Minimum donation amount is UGX 500' });
      return;
    }

    if (!phoneNumber) {
      setStatusMessage({ type: 'error', text: 'Phone number is required for Mobile Money' });
      return;
    }

    setLoading(true);
    try {
      const response = await donationService.createDonation({
        amount: parsedAmount,
        donationType,
        paymentMethod: 'mobile_money',
        provider,
        phoneNumber,
        isAnonymous,
      });

      const paymentUrl = response?.data?.paymentUrl;
      if (paymentUrl) {
        setStatusMessage({
          type: 'success',
          text: 'Opening secure payment checkout...',
        });
        await WebBrowser.openBrowserAsync(paymentUrl);
        setAmount('');
        return;
      }

      setStatusMessage({
        type: 'success',
        text: response?.message || 'Pesapal checkout created. Use the secure payment link to complete your donation.',
      });
      setAmount('');
    } catch (error: any) {
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.message || 'Donation submission failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>Secure Giving</ThemedText>
            <ThemedText style={styles.subtitle} themeColor="textSecondary">
              Support the worship, ministries, and community care at Chapel System.
            </ThemedText>
          </View>

          {statusMessage && (
            <View style={[styles.messageCard, statusMessage.type === 'error' ? styles.errorCard : styles.successCard]}>
              <ThemedText style={styles.messageText}>
                {typeof statusMessage.text === 'string' ? statusMessage.text : 'Donation recorded successfully.'}
              </ThemedText>
            </View>
          )}

          <View style={styles.card}>
            <ThemedText type="smallBold" style={styles.label}>Purpose / Category</ThemedText>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={donationType}
                onValueChange={(itemValue) => setDonationType(itemValue as string)}
                style={styles.picker}
                dropdownIconColor="#ffffff"
              >
                {donationOptions.map((opt) => (
                  <Picker.Item key={opt.id} label={opt.name} value={opt.id} color={Platform.OS === 'ios' ? '#ffffff' : '#000000'} />
                ))}
              </Picker>
            </View>

            <ThemedText type="smallBold" style={styles.label}>Amount (UGX)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5000"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="number-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <ThemedText type="smallBold" style={styles.label}>Preferred Mobile Wallet</ThemedText>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={provider}
                onValueChange={(itemValue) => setProvider(itemValue as string)}
                style={styles.picker}
                dropdownIconColor="#ffffff"
              >
                <Picker.Item label="MTN Mobile Money" value="MTN" color={Platform.OS === 'ios' ? '#ffffff' : '#000000'} />
                <Picker.Item label="Airtel Money" value="Airtel" color={Platform.OS === 'ios' ? '#ffffff' : '#000000'} />
              </Picker>
            </View>

            <ThemedText type="smallBold" style={styles.label}>Payment Phone Number</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g. 256770000000"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <View style={styles.switchRow}>
              <View>
                <ThemedText type="smallBold" style={styles.switchLabel}>Donate Anonymously</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Keep your name hidden from records.</ThemedText>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#315f72', true: '#2f7d46' }}
                thumbColor={isAnonymous ? '#9bd8aa' : '#b0b4ba'}
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleGive} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText type="smallBold" style={styles.buttonText}>Give Now</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <ThemedText type="smallBold" style={styles.infoTitle}>Bank Transfer Details</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
              Bank: Stanbic Bank Uganda{'\n'}
              Account Name: Chapel System{'\n'}
              Account Number: 9030012345678
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  label: {
    color: '#ffffff',
    marginBottom: Spacing.one,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.two,
    marginBottom: Spacing.three,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    color: '#ffffff',
    height: Platform.OS === 'android' ? 50 : undefined,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.two,
    paddingBottom: Spacing.three,
  },
  switchLabel: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#2f7d46',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    shadowColor: '#2f7d46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  messageCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginBottom: Spacing.four,
    borderWidth: 1,
  },
  errorCard: {
    backgroundColor: 'rgba(194, 65, 58, 0.15)',
    borderColor: 'rgba(194, 65, 58, 0.3)',
  },
  successCard: {
    backgroundColor: 'rgba(47, 125, 70, 0.15)',
    borderColor: 'rgba(47, 125, 70, 0.3)',
  },
  messageText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
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
});
