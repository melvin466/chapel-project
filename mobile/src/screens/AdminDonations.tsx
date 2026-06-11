import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  TextInput,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import donationService from '@/services/donationService';
import { formatCurrency, formatDate } from '@/utils/adminValidation';

interface Donation {
  _id: string;
  amount: number;
  purpose: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  donorName?: string;
  isAnonymous?: boolean;
  createdAt: string;
}

interface AdminDonationsProps {
  onBack: () => void;
}

const AdminDonations: React.FC<AdminDonationsProps> = ({ onBack }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [donationsRes, statsRes] = await Promise.all([
        donationService.getDonations({ status: statusFilter === 'all' ? undefined : statusFilter }),
        donationService.getDonationStats().catch(() => ({ data: {} })),
      ]);
      setDonations(donationsRes.data?.donations || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('Error loading donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDonations = useMemo(() => {
    let filtered = donations.filter(d =>
      !searchText || d.donorName?.toLowerCase().includes(searchText.toLowerCase()) ||
      d.purpose?.toLowerCase().includes(searchText.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [donations, searchText, sortBy]);

  const totalAmount = useMemo(
    () => filteredDonations.reduce((sum, d) => sum + d.amount, 0),
    [filteredDonations]
  );

  const renderDonationItem = ({ item }: { item: Donation }) => (
    <ThemedView style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.donor}>
          {item.isAnonymous ? 'Anonymous' : (item.donorName || 'Guest')}
        </ThemedText>
        <ThemedText style={[styles.status, styles[`status_${item.status}`]]}>
          {item.status}
        </ThemedText>
      </View>
      <ThemedText style={styles.amount}>{formatCurrency(item.amount)}</ThemedText>
      <ThemedText style={styles.purpose}>{item.purpose}</ThemedText>
      <View style={styles.footer}>
        <ThemedText style={styles.method}>{item.paymentMethod}</ThemedText>
        <ThemedText style={styles.date}>{formatDate(item.createdAt)}</ThemedText>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ThemedText style={styles.backButton}>‹ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Donations</ThemedText>
        <View style={{ width: 50 }} />
      </View>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContainer}
      >
        <ThemedView style={styles.statCard}>
          <ThemedText style={styles.statLabel}>Total</ThemedText>
          <ThemedText style={styles.statValue}>{formatCurrency(stats?.total || 0)}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statCard}>
          <ThemedText style={styles.statLabel}>This Month</ThemedText>
          <ThemedText style={styles.statValue}>{formatCurrency(stats?.monthlyTotal || 0)}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statCard}>
          <ThemedText style={styles.statLabel}>Count</ThemedText>
          <ThemedText style={styles.statValue}>{donations.length}</ThemedText>
        </ThemedView>
      </ScrollView>

      {/* Search & Filters */}
      <View style={styles.controlsContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search donor or purpose..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={searchText}
          onChangeText={setSearchText}
        />
        <View style={styles.filterRow}>
          {['all', 'completed', 'pending', 'failed'].map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterBtn, statusFilter === status && styles.filterBtnActive]}
              onPress={() => setStatusFilter(status)}
            >
              <ThemedText style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'date' && styles.sortBtnActive]}
            onPress={() => setSortBy('date')}
          >
            <ThemedText style={styles.sortText}>Recent</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'amount' && styles.sortBtnActive]}
            onPress={() => setSortBy('amount')}
          >
            <ThemedText style={styles.sortText}>Highest</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary */}
      {searchText && (
        <ThemedView style={styles.summaryCard}>
          <ThemedText style={styles.summaryText}>
            Filtered Total: {formatCurrency(totalAmount)} ({filteredDonations.length} donations)
          </ThemedText>
        </ThemedView>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.brand} />
        </View>
      ) : filteredDonations.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={styles.emptyText}>No donations found</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredDonations}
          renderItem={renderDonationItem}
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
  statsScroll: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  statsContainer: { gap: Spacing.two },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    minWidth: 140,
  },
  statLabel: { fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', marginBottom: Spacing.one },
  statValue: { fontSize: 16, fontWeight: '800', color: '#2f7d46' },
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
  sortRow: { flexDirection: 'row', gap: Spacing.two },
  sortBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  sortBtnActive: { backgroundColor: '#315f72', borderColor: '#d6a650' },
  sortText: { fontSize: 12, fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)' },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: '#9bd8aa',
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  summaryText: { fontSize: 12, color: '#9bd8aa', fontWeight: '600' },
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
  donor: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  status: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  status_completed: { color: '#9bd8aa' },
  status_pending: { color: '#d6a650' },
  status_failed: { color: '#ff6b6b' },
  amount: { fontSize: 16, fontWeight: '800', color: '#2f7d46', marginBottom: Spacing.one },
  purpose: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginBottom: Spacing.two },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  method: { fontSize: 11, color: 'rgba(255, 255, 255, 0.5)' },
  date: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)' },
});

export default AdminDonations;
