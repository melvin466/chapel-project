import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import bookingService from '@/services/bookingService';
import { formatDate } from '@/utils/adminValidation';

const AdminBookings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getManageBookings();
      setBookings(response.data?.bookings || []);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (bookingId: string) => {
    Alert.alert('Approve Booking', 'Approve this booking?', [
      { text: 'Cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await bookingService.approveBooking(bookingId);
            loadBookings();
          } catch (error) {
            Alert.alert('Error', 'Failed to approve booking');
          }
        },
      },
    ]);
  };

  const handleDeny = (bookingId: string) => {
    Alert.alert('Deny Booking', 'Deny this booking?', [
      { text: 'Cancel' },
      {
        text: 'Deny',
        onPress: async () => {
          try {
            await bookingService.denyBooking(bookingId);
            loadBookings();
          } catch (error) {
            Alert.alert('Error', 'Failed to deny booking');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#9bd8aa';
      case 'denied': return '#ff6b6b';
      case 'pending': return '#d6a650';
      default: return 'rgba(255, 255, 255, 0.6)';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ThemedText style={styles.backButton}>‹ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Bookings</ThemedText>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2f7d46" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={({ item }) => (
            <ThemedView style={styles.card}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.name}>{item.name}</ThemedText>
                <ThemedText style={[styles.status, { color: getStatusColor(item.status) }]}>
                  {item.status}
                </ThemedText>
              </View>
              <ThemedText style={styles.email}>{item.email}</ThemedText>
              <ThemedText style={styles.date}>{new Date(item.serviceDate).toLocaleDateString()}</ThemedText>
              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleApprove(item._id)}
                  >
                    <ThemedText style={styles.buttonText}>Approve</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.denyButton]}
                    onPress={() => handleDeny(item._id)}
                  >
                    <ThemedText style={styles.buttonText}>Deny</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </ThemedView>
          )}
          keyExtractor={item => item._id}
          scrollEnabled={false}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(16, 22, 28, 0.95)' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: { fontSize: 16, color: '#9bd8aa', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.two,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.one },
  name: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  status: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  email: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginBottom: Spacing.one },
  date: { fontSize: 11, color: 'rgba(255, 255, 255, 0.5)', marginBottom: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.two },
  button: { flex: 1, paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: 'center' },
  approveButton: { backgroundColor: 'rgba(47, 125, 70, 0.3)' },
  denyButton: { backgroundColor: 'rgba(194, 65, 58, 0.3)' },
  buttonText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
});

export default AdminBookings;
