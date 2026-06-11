import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import cellService, { Cell } from '../services/cellService';
import { useAuth } from '@/context/AuthContext';

interface CellsScreenProps {
  onBack: () => void;
}

const zones = ['All', 'North', 'South', 'East', 'West', 'Central'];

export default function CellsScreen({ onBack }: CellsScreenProps) {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const hasManagementAccess = ['admin', 'chaplain'].includes(user?.role);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [joinedCellId, setJoinedCellId] = useState('');
  const [pendingCellId, setPendingCellId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentCellId = (joinedCellId || user?.cellId?._id || user?.cellId || '').toString();

  const loadCells = async () => {
    try {
      setLoading(true);
      const params = selectedZone ? { zone: selectedZone } : {};
      const response = await cellService.getCells(params);
      setCells(response.data?.cells || []);
      setJoinedCellId(response.data?.viewer?.cellId || '');
      setPendingCellId(response.data?.viewer?.pendingCellId || '');
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load cell groups.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCells();
  }, [selectedZone]);

  const handleJoinCell = async (cellId: string) => {
    if (!isAuthenticated) {
      setMessage({ type: 'error', text: 'Please log in to join a cell.' });
      return;
    }

    setActionLoading(cellId);
    setMessage(null);
    try {
      const response = await cellService.joinCell(cellId);
      setMessage({
        type: 'success',
        text: response.message || (hasManagementAccess ? 'You joined this cell.' : 'Your request to join this cell has been sent.'),
      });

      if (response.data?.joinedDirectly || hasManagementAccess) {
        setJoinedCellId(response.data?.cellId || cellId);
      } else {
        setPendingCellId(cellId);
      }
      loadCells();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to join cell.' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCells = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return cells.filter((cell) => {
      const searchable = [
        cell.name,
        cell.description,
        cell.location,
        cell.zone,
        cell.meetingVenue,
        cell.meetingDay,
        cell.leader ? `${cell.leader.firstName || ''} ${cell.leader.lastName || ''}` : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return !query || searchable.includes(query);
    });
  }, [cells, searchQuery]);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ThemedText type="smallBold" style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.title}>Cell Groups</ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          Grow in smaller fellowships across Kampala.
        </ThemedText>
      </View>

      {/* Message Banner */}
      {message && (
        <View style={[styles.messageCard, message.type === 'error' ? styles.errorCard : styles.successCard]}>
          <ThemedText style={styles.messageText}>{message.text}</ThemedText>
        </View>
      )}

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name, leader, location..."
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Zone Filters */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {zones.map((zoneName) => {
            const isSelected = (selectedZone || 'All') === zoneName;
            return (
              <TouchableOpacity
                key={zoneName}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedZone(zoneName === 'All' ? '' : zoneName)}
              >
                <ThemedText type="smallBold" style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {zoneName}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Cells List */}
      {loading ? (
        <ActivityIndicator size="large" color="#2f7d46" style={styles.loader} />
      ) : filteredCells.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText type="smallBold" style={styles.emptyTitle}>No cell groups found</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Try adjusting your search criteria or selecting another zone.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredCells}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: cell }) => {
            const isCurrentCell = cell.viewerStatus === 'member' || (currentCellId && currentCellId === cell._id.toString());
            const hasOtherCell = currentCellId && !isCurrentCell;
            const isPending = cell.viewerStatus === 'pending' || pendingCellId?.toString() === cell._id.toString();

            const isButtonDisabled = isCurrentCell || hasOtherCell || isPending || actionLoading === cell._id;

            let buttonLabel = 'Request to Join';
            if (isCurrentCell) buttonLabel = 'Already a Member';
            else if (hasOtherCell) buttonLabel = 'Already in a Cell';
            else if (isPending) buttonLabel = 'Request Sent';
            else if (hasManagementAccess) buttonLabel = 'Join Cell';

            return (
              <View style={styles.cellCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.zoneBadge}>
                    <ThemedText type="code" style={styles.zoneText}>{cell.zone || 'General'}</ThemedText>
                  </View>
                  <ThemedText type="code" themeColor="brandSoft">
                    {cell.memberCount || 0}/{cell.maxCapacity || 30} members
                  </ThemedText>
                </View>

                <ThemedText type="smallBold" style={styles.cellName}>{cell.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.cellDesc}>
                  {cell.description || 'Gathering weekly for Bible study, fellowship, and prayer.'}
                </ThemedText>

                <View style={styles.divider} />

                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <ThemedText type="code" style={styles.detailLabel}>WHEN</ThemedText>
                    <ThemedText type="small" style={styles.detailValue}>
                      {cell.meetingDay || 'Wednesday'} · {cell.meetingTime || '5:30 PM'}
                    </ThemedText>
                  </View>
                  <View style={styles.detailItem}>
                    <ThemedText type="code" style={styles.detailLabel}>WHERE</ThemedText>
                    <ThemedText type="small" style={styles.detailValue}>
                      {cell.location || cell.meetingVenue || 'Fellowship Venue'}
                    </ThemedText>
                  </View>
                  {cell.leader && (
                    <View style={styles.detailItem}>
                      <ThemedText type="code" style={styles.detailLabel}>LEADER</ThemedText>
                      <ThemedText type="small" style={styles.detailValue}>
                        {cell.leader.firstName} {cell.leader.lastName}
                      </ThemedText>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.joinButton, isButtonDisabled && styles.joinButtonDisabled]}
                  onPress={() => handleJoinCell(cell._id)}
                  disabled={isButtonDisabled}
                >
                  {actionLoading === cell._id ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <ThemedText type="smallBold" style={styles.joinButtonText}>
                      {buttonLabel}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.two,
  },
  header: {
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.three,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  backButtonText: {
    color: '#9bd8aa',
  },
  title: {
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    color: '#ffffff',
    fontSize: 15,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  filterWrapper: {
    marginBottom: Spacing.three,
  },
  filterScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 99,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  filterChipActive: {
    backgroundColor: 'rgba(47, 125, 70, 0.28)',
    borderColor: 'rgba(155, 216, 170, 0.42)',
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  loader: {
    marginTop: Spacing.five,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: Spacing.one,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
  cellCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    marginBottom: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  zoneBadge: {
    backgroundColor: 'rgba(155, 216, 170, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(155, 216, 170, 0.22)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 99,
  },
  zoneText: {
    color: '#9bd8aa',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  cellName: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: Spacing.one,
  },
  cellDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: Spacing.three,
  },
  detailsContainer: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  detailItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  detailLabel: {
    color: '#d6a650',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 2,
  },
  detailValue: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
  },
  joinButton: {
    backgroundColor: '#2f7d46',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 15,
  },
  messageCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
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
    textAlign: 'center',
    lineHeight: 20,
  },
});
