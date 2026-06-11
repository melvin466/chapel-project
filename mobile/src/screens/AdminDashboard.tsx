import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import userService from '@/services/userService';
import eventService from '@/services/eventService';
import donationService from '@/services/donationService';
import prayerService from '@/services/prayerService';
import bookingService from '@/services/bookingService';

interface DashboardStats {
  users: number;
  events: number;
  donations: number;
  prayers: number;
  bookings: number;
  loading: boolean;
}

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
  role?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, role }) => {
  const isChaplain = role === 'chaplain';
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    events: 0,
    donations: 0,
    prayers: 0,
    bookings: 0,
    loading: true,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      const [users, events, donations, prayers, bookings] = await Promise.all([
        userService.getUsers().catch(() => ({ data: { users: [] } })),
        eventService.getEvents().catch(() => ({ data: { events: [] } })),
        donationService.getDonations().catch(() => ({ data: { donations: [] } })),
        prayerService.getPrayerRequests().catch(() => ({ data: { prayerRequests: [] } })),
        bookingService.getManageBookings().catch(() => ({ data: { bookings: [] } })),
      ]);

      setStats({
        users: users.data?.users?.length || 0,
        events: events.data?.events?.length || 0,
        donations: donations.data?.donations?.length || 0,
        prayers: prayers.data?.prayerRequests?.length || 0,
        bookings: bookings.data?.bookings?.length || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const menuItems = [
    { id: 'users', label: 'Users', icon: '👥', count: stats.users },
    { id: 'events', label: 'Events', icon: '📅', count: stats.events },
    { id: 'donations', label: 'Donations', icon: '💰', count: stats.donations },
    { id: 'announcements', label: 'Announcements', icon: '📢', count: 0 },
    { id: 'prayers', label: 'Prayers', icon: '🙏', count: stats.prayers },
    { id: 'bookings', label: 'Bookings', icon: '📋', count: stats.bookings },
    { id: 'cells', label: 'Cells', icon: '👫', count: 0 },
    { id: 'reports', label: 'Reports', icon: '📊', count: 0 },
    { id: 'audit', label: 'Audit Logs', icon: '🔍', count: 0 },
  ];

  const renderMenuItem = ({ item }: { item: typeof menuItems[0] }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => onNavigate(item.id)}
      activeOpacity={0.8}
    >
      <ThemedView style={styles.menuItemContent}>
        <ThemedText style={styles.menuIcon}>{item.icon}</ThemedText>
        <View style={styles.menuTextContainer}>
          <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
          {item.count > 0 && (
            <ThemedText style={styles.menuCount}>{item.count} items</ThemedText>
          )}
        </View>
        <ThemedText style={styles.menuArrow}>›</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, isChaplain && styles.chaplainContainer]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ThemedText style={[styles.title, isChaplain && styles.chaplainTitle]}>
        {isChaplain ? 'Chaplain Dashboard' : 'Admin Dashboard'}
      </ThemedText>
      <ThemedText style={[styles.subtitle, isChaplain && styles.chaplainSubtitle]}>
        {isChaplain ? 'Pastoral care, chapel operations, and community oversight.' : 'System operations, reporting, and chapel administration.'}
      </ThemedText>

      {stats.loading ? (
        <ActivityIndicator size="large" color={Colors.light.brand} />
      ) : (
        <>
          <View style={styles.statsGrid}>
            <ThemedView style={styles.statCard}>
              <ThemedText style={[styles.statNumber, isChaplain && styles.chaplainStatNumber]}>{stats.users}</ThemedText>
              <ThemedText style={styles.statLabel}>Users</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText style={[styles.statNumber, isChaplain && styles.chaplainStatNumber]}>{stats.events}</ThemedText>
              <ThemedText style={styles.statLabel}>Events</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText style={[styles.statNumber, isChaplain && styles.chaplainStatNumber]}>{stats.donations}</ThemedText>
              <ThemedText style={styles.statLabel}>Donations</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText style={[styles.statNumber, isChaplain && styles.chaplainStatNumber]}>{stats.bookings}</ThemedText>
              <ThemedText style={styles.statLabel}>Bookings</ThemedText>
            </ThemedView>
          </View>

          <ThemedText style={[styles.sectionTitle, isChaplain && styles.chaplainSectionTitle]}>
            {isChaplain ? 'Chapel Care' : 'Management'}
          </ThemedText>
          <FlatList
            data={menuItems}
            renderItem={renderMenuItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(16, 22, 28, 0.95)',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: Spacing.one,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.four,
  },
  chaplainContainer: {
    backgroundColor: 'rgba(14, 21, 31, 0.97)',
  },
  chaplainTitle: {
    color: '#d8c690',
  },
  chaplainSubtitle: {
    color: 'rgba(226, 218, 188, 0.76)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.five,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2f7d46',
    marginBottom: Spacing.one,
  },
  chaplainStatNumber: {
    color: '#d8c690',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9bd8aa',
    marginBottom: Spacing.three,
    marginTop: Spacing.four,
    textTransform: 'uppercase',
  },
  chaplainSectionTitle: {
    color: '#d8c690',
  },
  menuItem: {
    marginVertical: Spacing.two,
  },
  menuItemContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: Spacing.three,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  menuCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: Spacing.one,
  },
  menuArrow: {
    fontSize: 20,
    color: '#9bd8aa',
    marginLeft: Spacing.two,
  },
  separator: {
    height: Spacing.one,
  },
});

export default AdminDashboard;
