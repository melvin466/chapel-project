import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import eventService from '@/services/eventService';
import donationService from '@/services/donationService';
import userService from '@/services/userService';

const AdminReports: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [events, donations, users] = await Promise.all([
        eventService.getEvents().catch(() => ({ data: { events: [] } })),
        donationService.getDonations().catch(() => ({ data: { donations: [] } })),
        userService.getUsers().catch(() => ({ data: { users: [] } })),
      ]);

      const eventsData = events.data?.events || [];
      const donationsData = donations.data?.donations || [];
      const usersData = users.data?.users || [];

      setStats({
        totalEvents: eventsData.length,
        publishedEvents: eventsData.filter((e: any) => e.status === 'published').length,
        totalDonations: donationsData.reduce((sum: number, d: any) => sum + (d.amount || 0), 0),
        donationCount: donationsData.length,
        totalUsers: usersData.length,
        adminCount: usersData.filter((u: any) => u.role === 'admin').length,
        chaplainsCount: usersData.filter((u: any) => u.role === 'chaplain').length,
        chapelLeadersCount: usersData.filter((u: any) => u.role === 'chapel_leader').length,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ThemedText style={styles.backButton}>‹ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Reports</ThemedText>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2f7d46" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText style={styles.sectionTitle}>Events</ThemedText>
          <View style={styles.grid}>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Total Events</ThemedText>
              <ThemedText style={styles.statValue}>{stats?.totalEvents || 0}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Published</ThemedText>
              <ThemedText style={styles.statValue}>{stats?.publishedEvents || 0}</ThemedText>
            </ThemedView>
          </View>

          <ThemedText style={styles.sectionTitle}>Donations</ThemedText>
          <View style={styles.grid}>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Total Amount</ThemedText>
              <ThemedText style={styles.statValue}>₦{stats?.totalDonations?.toLocaleString() || 0}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Transactions</ThemedText>
              <ThemedText style={styles.statValue}>{stats?.donationCount || 0}</ThemedText>
            </ThemedView>
          </View>

          <ThemedText style={styles.sectionTitle}>Users</ThemedText>
          <View style={styles.grid}>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Total Users</ThemedText>
              <ThemedText style={styles.statValue}>{stats?.totalUsers || 0}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Admins</ThemedText>
              <ThemedText style={styles.statValue}>{stats?.adminCount || 0}</ThemedText>
            </ThemedView>
          </View>
          <View style={styles.grid}>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Chaplains</ThemedText>
              <ThemedText style={styles.statValue}>{stats?.chaplainsCount || 0}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Chapel Leaders</ThemedText>
              <ThemedText style={styles.statValue}>{stats?.chapelLeadersCount || 0}</ThemedText>
            </ThemedView>
          </View>
        </ScrollView>
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
  content: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.four },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#9bd8aa', marginBottom: Spacing.three, marginTop: Spacing.three, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.four },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginBottom: Spacing.one },
  statValue: { fontSize: 18, fontWeight: '700', color: '#2f7d46' },
});

export default AdminReports;
