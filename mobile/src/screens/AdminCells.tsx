import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import cellService from '@/services/cellService';

const AdminCells: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [cells, setCells] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCells();
  }, []);

  const loadCells = async () => {
    try {
      setLoading(true);
      const response = await cellService.getCells?.() || { data: { cells: [] } };
      setCells(response.data?.cells || []);
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
        <ThemedText style={styles.title}>Cell Groups</ThemedText>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2f7d46" />
        </View>
      ) : (
        <FlatList
          data={cells}
          renderItem={({ item }) => (
            <ThemedView style={styles.card}>
              <ThemedText style={styles.name}>{item.name}</ThemedText>
              <ThemedText style={styles.leader}>Leader: {item.leader}</ThemedText>
              <ThemedText style={styles.zone}>Zone: {item.zone}</ThemedText>
              <ThemedText style={styles.members}>{item.members?.length || 0} members</ThemedText>
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
  name: { fontSize: 14, fontWeight: '700', color: '#ffffff', marginBottom: Spacing.one },
  leader: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginBottom: Spacing.one },
  zone: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginBottom: Spacing.one },
  members: { fontSize: 11, color: '#9bd8aa', fontWeight: '600' },
});

export default AdminCells;
