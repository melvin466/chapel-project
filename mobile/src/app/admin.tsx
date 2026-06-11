import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from 'react-native';

// Import admin screens
import AdminDashboard from '@/screens/AdminDashboard';
import AdminUsers from '@/screens/AdminUsers';
import AdminEvents from '@/screens/AdminEvents';
import AdminDonations from '@/screens/AdminDonations';
import AdminAnnouncements from '@/screens/AdminAnnouncements';
import AdminPrayerRequests from '@/screens/AdminPrayerRequests';
import AdminBookings from '@/screens/AdminBookings';
import AdminCells from '@/screens/AdminCells';
import AdminReports from '@/screens/AdminReports';
import AdminAuditLogs from '@/screens/AdminAuditLogs';

type AdminView = 'dashboard' | 'users' | 'events' | 'donations' | 'announcements' | 'prayers' | 'bookings' | 'cells' | 'reports' | 'audit';

export default function AdminScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const hasManagementAccess = ['admin', 'chaplain'].includes(user?.role);

  // Redirect if not admin or chaplain
  if (!hasManagementAccess) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>Admin or Chaplain access required</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const renderAdminScreen = () => {
    switch (activeView) {
      case 'users':
        return <AdminUsers onBack={() => setActiveView('dashboard')} />;
      case 'events':
        return <AdminEvents onBack={() => setActiveView('dashboard')} />;
      case 'donations':
        return <AdminDonations onBack={() => setActiveView('dashboard')} />;
      case 'announcements':
        return <AdminAnnouncements onBack={() => setActiveView('dashboard')} />;
      case 'prayers':
        return <AdminPrayerRequests onBack={() => setActiveView('dashboard')} />;
      case 'bookings':
        return <AdminBookings onBack={() => setActiveView('dashboard')} />;
      case 'cells':
        return <AdminCells onBack={() => setActiveView('dashboard')} />;
      case 'reports':
        return <AdminReports onBack={() => setActiveView('dashboard')} />;
      case 'audit':
        return <AdminAuditLogs onBack={() => setActiveView('dashboard')} />;
      case 'dashboard':
      default:
        return <AdminDashboard onNavigate={(view) => setActiveView(view as AdminView)} role={user?.role} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemedView style={styles.container}>
        {renderAdminScreen()}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: Spacing.five,
  },
});
