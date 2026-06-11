import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import prayerService from '@/services/prayerService';
import { formatDate } from '@/utils/adminValidation';

interface PrayerRequest {
  _id: string;
  title: string;
  description: string;
  urgency: 'normal' | 'urgent' | 'critical';
  status: 'active' | 'answered' | 'closed';
  createdAt: string;
}

interface AdminPrayerRequestsProps {
  onBack: () => void;
}

const AdminPrayerRequests: React.FC<AdminPrayerRequestsProps> = ({ onBack }) => {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchText, setSearchText] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPrayers();
  }, []);

  const loadPrayers = async () => {
    try {
      setLoading(true);
      const response = await prayerService.getPrayerRequests();
      setPrayers(response.data?.prayerRequests || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load prayers' });
    } finally {
      setLoading(false);
    }
  };

  const filteredPrayers = useMemo(() => {
    return prayers.filter(p => {
      const matchesUrgency = urgencyFilter === 'all' || p.urgency === urgencyFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesSearch = !searchText ||
        p.title.toLowerCase().includes(searchText.toLowerCase()) ||
        p.description.toLowerCase().includes(searchText.toLowerCase());
      return matchesUrgency && matchesStatus && matchesSearch;
    });
  }, [prayers, urgencyFilter, statusFilter, searchText]);

  const handleMarkAnswered = (prayer: PrayerRequest) => {
    Alert.alert('Mark as Answered', 'Mark this prayer request as answered?', [
      { text: 'Cancel' },
      {
        text: 'Mark Answered',
        onPress: async () => {
          try {
            await prayerService.markAnswered(prayer._id);
            setMessage({ type: 'success', text: 'Prayer marked as answered' });
            loadPrayers();
          } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update' });
          }
        },
      },
    ]);
  };

  const handleDelete = (prayer: PrayerRequest) => {
    Alert.alert('Delete Prayer Request', `Delete "${prayer.title}"?`, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await prayerService.deletePrayerRequest(prayer._id);
            setMessage({ type: 'success', text: 'Prayer request deleted' });
            loadPrayers();
          } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete' });
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#f44336';
      case 'urgent': return '#d6a650';
      default: return '#4CAF50';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ThemedText style={styles.backButton}>‹ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Prayer Requests</ThemedText>
        <View style={{ width: 50 }} />
      </View>

      {message && (
        <ThemedView style={[styles.message, styles[`message-${message.type}`]]}>
          <ThemedText style={styles.messageText}>{message.text}</ThemedText>
        </ThemedView>
      )}

      <View style={styles.controlsContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search title or description..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={searchText}
          onChangeText={setSearchText}
        />
        <View style={styles.filterRow}>
          {['all', 'normal', 'urgent', 'critical'].map(urgency => (
            <TouchableOpacity
              key={urgency}
              style={[styles.filterBtn, urgencyFilter === urgency && styles.filterBtnActive]}
              onPress={() => setUrgencyFilter(urgency)}
            >
              <ThemedText style={[styles.filterText, urgencyFilter === urgency && styles.filterTextActive]}>
                {urgency === 'all' ? 'All' : urgency.slice(0, 3).toUpperCase()}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.statusRow}>
          {['all', 'active', 'answered', 'closed'].map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.statusBtn, statusFilter === status && styles.statusBtnActive]}
              onPress={() => setStatusFilter(status)}
            >
              <ThemedText style={styles.statusText}>
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2f7d46" />
        </View>
      ) : filteredPrayers.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={styles.emptyText}>No prayer requests found</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredPrayers}
          renderItem={({ item }) => (
            <ThemedView style={styles.card}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.titleText}>{item.title}</ThemedText>
                <ThemedText style={[styles.urgency, { color: getUrgencyColor(item.urgency) }]}>
                  {item.urgency}
                </ThemedText>
              </View>
              <ThemedText style={styles.content} numberOfLines={2}>{item.description}</ThemedText>
              <View style={styles.meta}>
                <ThemedText style={styles.date}>{formatDate(item.createdAt)}</ThemedText>
                <ThemedText style={[styles.status, item.status === 'answered' && styles.answered]}>
                  {item.status}
                </ThemedText>
              </View>
              {item.status === 'active' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.button, styles.answerButton]}
                    onPress={() => handleMarkAnswered(item)}
                  >
                    <ThemedText style={styles.buttonText}>Mark Answered</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={() => handleDelete(item)}
                  >
                    <ThemedText style={styles.buttonText}>Delete</ThemedText>
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
  message: {
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  'message-success': {
    backgroundColor: 'rgba(47, 125, 70, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#9bd8aa',
  },
  'message-error': {
    backgroundColor: 'rgba(194, 65, 58, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  messageText: { color: '#ffffff', fontSize: 12 },
  controlsContainer: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
    color: '#1f2933',
    fontSize: 14,
  },
  filterRow: { flexDirection: 'row', gap: Spacing.one, marginBottom: Spacing.two },
  filterBtn: {
    flex: 1,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#2f7d46', borderColor: '#9bd8aa' },
  filterText: { fontSize: 10, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' },
  filterTextActive: { color: '#ffffff' },
  statusRow: { flexDirection: 'row', gap: Spacing.one },
  statusBtn: {
    flex: 1,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  statusBtnActive: { backgroundColor: '#315f72', borderColor: '#d6a650' },
  statusText: { fontSize: 10, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: 'rgba(255, 255, 255, 0.6)' },
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
  titleText: { fontSize: 14, fontWeight: '700', color: '#ffffff', flex: 1 },
  urgency: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', marginLeft: Spacing.two },
  content: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginVertical: Spacing.one },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.two },
  date: { fontSize: 11, color: 'rgba(255, 255, 255, 0.5)' },
  status: { fontSize: 10, color: '#d6a650', fontWeight: '600' },
  answered: { color: '#9bd8aa' },
  actions: { flexDirection: 'row', gap: Spacing.two },
  button: { flex: 1, paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: 'center' },
  answerButton: { backgroundColor: 'rgba(47, 125, 70, 0.3)' },
  deleteButton: { backgroundColor: 'rgba(194, 65, 58, 0.3)' },
  buttonText: { fontSize: 11, fontWeight: '600', color: '#ffffff' },
});

export default AdminPrayerRequests;
