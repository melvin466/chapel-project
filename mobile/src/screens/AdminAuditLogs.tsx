import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const AdminAuditLogs: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      // Placeholder - would call auditService.getAuditLogs()
      setLogs([
        { _id: '1', user: 'Admin', action: 'Created user', timestamp: new Date().toISOString() },
        { _id: '2', user: 'Admin', action: 'Updated event', timestamp: new Date().toISOString() },
        { _id: '3', user: 'Admin', action: 'Approved booking', timestamp: new Date().toISOString() },
      ]);
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
        <ThemedText style={styles.title}>Audit Logs</ThemedText>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2f7d46" />
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={({ item }) => (
            <ThemedView style={styles.card}>
              <ThemedText style={styles.user}>{item.user}</ThemedText>
              <ThemedText style={styles.action}>{item.action}</ThemedText>
              <ThemedText style={styles.time}>{new Date(item.timestamp).toLocaleString()}</ThemedText>
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
  user: { fontSize: 12, fontWeight: '700', color: '#9bd8aa', marginBottom: Spacing.one },
  action: { fontSize: 13, color: '#ffffff', marginBottom: Spacing.one },
  time: { fontSize: 11, color: 'rgba(255, 255, 255, 0.5)' },
});

export default AdminAuditLogs;
