import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import notificationService, { Notification } from '../services/notificationService';
import { useAuth } from '@/context/AuthContext';

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigate: (view: 'cells' | 'bookings' | 'prayers' | 'sermons') => void;
}

export default function NotificationsScreen({ onBack, onNavigate }: NotificationsScreenProps) {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load notifications.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    setActionLoading(id);
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not mark notification read.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await notificationService.markAllAsRead();
      setMessage({ type: 'success', text: 'All notifications marked as read.' });
      loadNotifications();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to mark all as read.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationTap = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    if (notification.type === 'booking') {
      onNavigate('bookings');
      return;
    }

    if (notification.type === 'cell' || notification.data?.cellId) {
      onNavigate('cells');
      return;
    }

    if (notification.type === 'prayer') {
      onNavigate('prayers');
      return;
    }

    if (notification.type === 'announcement') {
      onNavigate('sermons'); // Default fallback or announcements details
      return;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ThemedText type="smallBold" style={styles.backButtonText}>← Back</ThemedText>
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllAsRead}>
              <ThemedText type="code" style={styles.markAllText}>Mark All Read</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        <ThemedText type="subtitle" style={styles.title}>Notifications</ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          {unreadCount} unread message{unreadCount === 1 ? '' : 's'}
        </ThemedText>
      </View>

      {/* Message Banner */}
      {message && (
        <View style={[styles.messageCard, message.type === 'error' ? styles.errorCard : styles.successCard]}>
          <ThemedText style={styles.messageText}>{message.text}</ThemedText>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#2f7d46" style={styles.loader} />
      ) : !isAuthenticated ? (
        <View style={styles.emptyContainer}>
          <ThemedText type="smallBold" style={styles.emptyTitle}>Sign in required</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Please sign in to see your user notifications.
          </ThemedText>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText type="smallBold" style={styles.emptyTitle}>No notifications</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            You do not have any notifications yet.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: n }) => {
            return (
              <TouchableOpacity
                style={[styles.notificationCard, !n.isRead && styles.notificationUnread]}
                onPress={() => handleNotificationTap(n)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <ThemedText type="smallBold" style={styles.iconText}>
                      {n.type?.slice(0, 1).toUpperCase() || 'N'}
                    </ThemedText>
                  </View>
                  <View style={styles.titleContainer}>
                    <ThemedText type="smallBold" style={styles.nTitle}>{n.title}</ThemedText>
                    <ThemedText type="code" themeColor="textSecondary" style={styles.nTime}>
                      {formatTime(n.createdAt)}
                    </ThemedText>
                  </View>
                  {!n.isRead && <View style={styles.unreadDot} />}
                </View>

                <ThemedText type="small" themeColor="textSecondary" style={styles.nMessage}>
                  {n.message}
                </ThemedText>

                {!n.isRead && (
                  <TouchableOpacity
                    style={styles.markReadBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(n._id);
                    }}
                    disabled={actionLoading === n._id}
                  >
                    {actionLoading === n._id ? (
                      <ActivityIndicator size="small" color="#9bd8aa" />
                    ) : (
                      <ThemedText type="code" style={styles.markReadText}>Mark Read</ThemedText>
                    )}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  backButton: {
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
  markAllBtn: {
    borderWidth: 1,
    borderColor: 'rgba(155, 216, 170, 0.3)',
    backgroundColor: 'rgba(47, 125, 70, 0.12)',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  markAllText: {
    color: '#9bd8aa',
    fontWeight: 'bold',
  },
  title: {
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
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
  notificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    marginBottom: Spacing.three,
  },
  notificationUnread: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(155, 216, 170, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  iconContainer: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: '#315f72',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
  },
  iconText: {
    color: '#ffffff',
  },
  titleContainer: {
    flex: 1,
  },
  nTitle: {
    color: '#ffffff',
    fontSize: 15,
  },
  nTime: {
    fontSize: 10,
  },
  unreadDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#9bd8aa',
  },
  nMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.two,
  },
  markReadBtn: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  markReadText: {
    color: '#9bd8aa',
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
