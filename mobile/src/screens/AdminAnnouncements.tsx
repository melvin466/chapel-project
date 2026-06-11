import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import announcementService from '@/services/announcementService';
import { validateForm, formatDate } from '@/utils/adminValidation';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'published' | 'draft';
  expiryDate?: string;
  createdAt: string;
}

interface AdminAnnouncementsProps {
  onBack: () => void;
}

type AnnouncementPriority = 'low' | 'medium' | 'high' | 'critical';
type AnnouncementStatus = 'published' | 'draft';

const AdminAnnouncements: React.FC<AdminAnnouncementsProps> = ({ onBack }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    priority: AnnouncementPriority;
    status: AnnouncementStatus;
    expiryDate: string;
  }>({
    title: '',
    content: '',
    priority: 'medium',
    status: 'published',
    expiryDate: '',
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getAnnouncements();
      setAnnouncements(response.data?.announcements || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load announcements' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      status: 'published',
      expiryDate: '',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingItem(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority || 'medium',
      status: announcement.status || 'published',
      expiryDate: announcement.expiryDate || '',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    const { valid, errors } = validateForm(formData, ['title', 'content']);

    if (!valid) {
      setFormErrors(errors);
      return;
    }

    // Validate expiry date if provided
    if (formData.expiryDate && new Date(formData.expiryDate) < new Date()) {
      setFormErrors({ ...errors, expiryDate: 'Expiry date must be in the future' });
      return;
    }

    try {
      setMessage(null);
      if (editingItem) {
        await announcementService.updateAnnouncement(editingItem._id, formData);
        setMessage({ type: 'success', text: 'Announcement updated successfully' });
      } else {
        await announcementService.createAnnouncement(formData);
        setMessage({ type: 'success', text: 'Announcement created successfully' });
      }
      setShowForm(false);
      loadAnnouncements();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save announcement' });
    }
  };

  const handleDelete = (announcement: Announcement) => {
    Alert.alert(
      'Delete Announcement',
      `Delete "${announcement.title}"?`,
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await announcementService.deleteAnnouncement(announcement._id);
              setMessage({ type: 'success', text: 'Announcement deleted' });
              loadAnnouncements();
            } catch (error: any) {
              setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete' });
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const isExpired = (announcement: Announcement) => {
    return announcement.expiryDate && new Date(announcement.expiryDate) < new Date();
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196F3';
      default: return '#4CAF50';
    }
  };

  const renderAnnouncement = ({ item }: { item: Announcement }) => (
    <ThemedView style={[styles.card, isExpired(item) && styles.expiredCard]}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.title} numberOfLines={1}>{item.title}</ThemedText>
        <ThemedText style={[styles.priority, { color: getPriorityColor(item.priority) }]}>
          {item.priority}
        </ThemedText>
      </View>
      <ThemedText style={styles.content} numberOfLines={2}>{item.content}</ThemedText>
      {item.expiryDate && (
        <ThemedText style={[styles.expiry, isExpired(item) && styles.expiredText]}>
          Expires: {formatDate(item.expiryDate)} {isExpired(item) ? '(EXPIRED)' : ''}
        </ThemedText>
      )}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => handleEdit(item)}>
          <ThemedText style={styles.buttonText}>Edit</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => handleDelete(item)}>
          <ThemedText style={styles.buttonText}>Delete</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ThemedText style={styles.backButton}>‹ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Announcements</ThemedText>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
          <ThemedText style={styles.createButtonText}>+ New</ThemedText>
        </TouchableOpacity>
      </View>

      {message && (
        <ThemedView style={[styles.message, styles[`message-${message.type}`]]}>
          <ThemedText style={styles.messageText}>{message.text}</ThemedText>
        </ThemedView>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.brand} />
        </View>
      ) : announcements.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={styles.emptyText}>No announcements</ThemedText>
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderAnnouncement}
          keyExtractor={item => item._id}
          scrollEnabled={false}
        />
      )}

      <Modal visible={showForm} animationType="slide" transparent>
        <ThemedView style={styles.modal}>
          <ScrollView contentContainerStyle={styles.formContent}>
            <View style={styles.formHeader}>
              <ThemedText style={styles.formTitle}>
                {editingItem ? 'Edit Announcement' : 'Create Announcement'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, formErrors.title && styles.inputError]}
              placeholder="Title"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={formData.title}
              onChangeText={text => {
                setFormData({ ...formData, title: text });
                if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
              }}
            />
            {formErrors.title && <ThemedText style={styles.errorText}>{formErrors.title}</ThemedText>}

            <TextInput
              style={[styles.input, styles.textArea, formErrors.content && styles.inputError]}
              placeholder="Content"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={formData.content}
              onChangeText={text => {
                setFormData({ ...formData, content: text });
                if (formErrors.content) setFormErrors({ ...formErrors, content: '' });
              }}
              multiline
              numberOfLines={4}
            />
            {formErrors.content && <ThemedText style={styles.errorText}>{formErrors.content}</ThemedText>}

            <ThemedText style={styles.label}>Priority</ThemedText>
            <View style={styles.priorityButtons}>
              {(['low', 'medium', 'high', 'critical'] as AnnouncementPriority[]).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityButton, formData.priority === p && styles.priorityButtonActive]}
                  onPress={() => setFormData({ ...formData, priority: p })}
                >
                  <ThemedText style={styles.priorityButtonText}>{p}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={styles.label}>Status</ThemedText>
            <View style={styles.statusButtons}>
              {(['draft', 'published'] as AnnouncementStatus[]).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusButton, formData.status === s && styles.statusButtonActive]}
                  onPress={() => setFormData({ ...formData, status: s })}
                >
                  <ThemedText style={styles.statusButtonText}>{s}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={styles.label}>Expiry Date (Optional)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD or leave blank"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={formData.expiryDate}
              onChangeText={text => setFormData({ ...formData, expiryDate: text })}
            />
            {formErrors.expiryDate && <ThemedText style={styles.errorText}>{formErrors.expiryDate}</ThemedText>}

            <View style={styles.formActions}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setShowForm(false)}>
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                <ThemedText style={styles.buttonText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  createButton: {
    backgroundColor: '#2f7d46',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  createButtonText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
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
  expiredCard: { opacity: 0.6, borderColor: 'rgba(244, 67, 54, 0.3)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.one },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: '#ffffff' },
  priority: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', marginLeft: Spacing.two },
  content: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginVertical: Spacing.one },
  expiry: { fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', marginBottom: Spacing.two },
  expiredText: { color: '#ff6b6b', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: Spacing.two },
  button: { flex: 1, paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: 'center' },
  editButton: { backgroundColor: 'rgba(214, 166, 80, 0.3)' },
  deleteButton: { backgroundColor: 'rgba(194, 65, 58, 0.3)' },
  buttonText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  modal: { flex: 1, backgroundColor: 'rgba(16, 22, 28, 0.98)' },
  formContent: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.four },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  closeButton: { fontSize: 24, color: 'rgba(255, 255, 255, 0.6)' },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(31, 41, 51, 0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
    color: '#1f2933',
    fontSize: 14,
  },
  inputError: { borderColor: '#ff6b6b', backgroundColor: 'rgba(255, 107, 107, 0.1)' },
  textArea: { textAlignVertical: 'top', minHeight: 100 },
  errorText: { color: '#ff6b6b', fontSize: 11, marginBottom: Spacing.two, marginTop: -Spacing.two },
  label: { fontSize: 14, fontWeight: '600', color: 'rgba(255, 255, 255, 0.78)', marginBottom: Spacing.two },
  priorityButtons: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.four },
  priorityButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  priorityButtonActive: { backgroundColor: '#2f7d46', borderColor: '#9bd8aa' },
  priorityButtonText: { fontSize: 12, fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)' },
  statusButtons: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.four },
  statusButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  statusButtonActive: { backgroundColor: '#315f72', borderColor: '#d6a650' },
  statusButtonText: { fontSize: 12, fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)' },
  formActions: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.four },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  saveButton: { flex: 1, backgroundColor: '#2f7d46' },
});

export default AdminAnnouncements;
