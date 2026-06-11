import React, { useState, useEffect, useMemo } from 'react';
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
import eventService from '@/services/eventService';
import { validateForm, formatDate } from '@/utils/adminValidation';

type EventStatus = 'published' | 'draft';

interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  status?: EventStatus;
}

interface AdminEventsProps {
  onBack: () => void;
}

const AdminEvents: React.FC<AdminEventsProps> = ({ onBack }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    status: EventStatus;
  }>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    status: 'draft',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const response = await eventService.getEvents();
      setEvents(response.data?.events || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load events' });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events.filter(e => {
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchesSearch = !searchText ||
        e.title.toLowerCase().includes(searchText.toLowerCase()) ||
        (e.location || '').toLowerCase().includes(searchText.toLowerCase()) ||
        e.description.toLowerCase().includes(searchText.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    return filtered;
  }, [events, statusFilter, searchText, sortBy]);

  const handleCreateNew = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      status: 'draft',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate || '',
      location: event.location || '',
      status: event.status || 'draft',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    const { valid, errors } = validateForm(formData, ['title', 'description', 'startDate', 'endDate', 'location']);

    if (!valid) {
      setFormErrors(errors);
      return;
    }

    try {
      setMessage(null);
      if (editingEvent) {
        await eventService.updateEvent(editingEvent._id, formData);
        setMessage({ type: 'success', text: 'Event updated successfully' });
      } else {
        await eventService.createEvent(formData);
        setMessage({ type: 'success', text: 'Event created successfully' });
      }
      setShowForm(false);
      loadEvents();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save event' });
    }
  };

  const handleDelete = (event: Event) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await eventService.deleteEvent(event._id);
              setMessage({ type: 'success', text: 'Event deleted successfully' });
              loadEvents();
            } catch (error: any) {
              setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete event' });
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const filteredEvents = statusFilter === 'all' ? events : events.filter(e => e.status === statusFilter);

  const renderEventItem = ({ item }: { item: Event }) => (
    <ThemedView style={styles.card}>
      <View style={styles.info}>
        <ThemedText style={styles.title}>{item.title}</ThemedText>
        <ThemedText style={styles.location}>{item.location || 'Location TBA'}</ThemedText>
        <ThemedText style={styles.date}>
          {formatDate(item.startDate)} → {formatDate(item.endDate)}
        </ThemedText>
        <ThemedText style={[styles.status, item.status === 'published' && styles.published]}>
          {item.status}
        </ThemedText>
      </View>
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
        <ThemedText style={styles.headerTitle}>Events</ThemedText>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
          <ThemedText style={styles.createButtonText}>+ New</ThemedText>
        </TouchableOpacity>
      </View>

      {message && (
        <ThemedView style={[styles.message, styles[`message-${message.type}`]]}>
          <ThemedText style={styles.messageText}>{message.text}</ThemedText>
        </ThemedView>
      )}

      <View style={styles.controlsContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search title or location..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={searchText}
          onChangeText={setSearchText}
        />
        <View style={styles.filterRow}>
          {['all', 'published', 'draft'].map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterBtn, statusFilter === status && styles.filterBtnActive]}
              onPress={() => setStatusFilter(status)}
            >
              <ThemedText style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
                {status === 'all' ? 'All' : status.slice(0, 3).toUpperCase()}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.sortRow}>
          {['date', 'title'].map(sort => (
            <TouchableOpacity
              key={sort}
              style={[styles.sortBtn, sortBy === (sort as any) && styles.sortBtnActive]}
              onPress={() => setSortBy(sort as any)}
            >
              <ThemedText style={styles.sortText}>{sort.charAt(0).toUpperCase() + sort.slice(1)}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.brand} />
        </View>
      ) : filteredAndSortedEvents.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={styles.emptyText}>No events found</ThemedText>
        </View>
      ) : (
        <FlatList data={filteredAndSortedEvents} renderItem={renderEventItem} keyExtractor={item => item._id} scrollEnabled={false} />
      )}

      <Modal visible={showForm} animationType="slide" transparent>
        <ThemedView style={styles.modal}>
          <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
            <View style={styles.formHeader}>
              <ThemedText style={styles.formTitle}>
                {editingEvent ? 'Edit Event' : 'Create Event'}
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
              style={[styles.input, styles.textArea, formErrors.description && styles.inputError]}
              placeholder="Description"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={formData.description}
              onChangeText={text => {
                setFormData({ ...formData, description: text });
                if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
              }}
              multiline
              numberOfLines={4}
            />
            {formErrors.description && <ThemedText style={styles.errorText}>{formErrors.description}</ThemedText>}

            <TextInput
              style={[styles.input, formErrors.location && styles.inputError]}
              placeholder="Location"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={formData.location}
              onChangeText={text => {
                setFormData({ ...formData, location: text });
                if (formErrors.location) setFormErrors({ ...formErrors, location: '' });
              }}
            />
            {formErrors.location && <ThemedText style={styles.errorText}>{formErrors.location}</ThemedText>}

            <TextInput
              style={[styles.input, formErrors.startDate && styles.inputError]}
              placeholder="Start Date (YYYY-MM-DD)"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={formData.startDate}
              onChangeText={text => {
                setFormData({ ...formData, startDate: text });
                if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: '' });
              }}
            />
            {formErrors.startDate && <ThemedText style={styles.errorText}>{formErrors.startDate}</ThemedText>}

            <TextInput
              style={[styles.input, formErrors.endDate && styles.inputError]}
              placeholder="End Date (YYYY-MM-DD)"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={formData.endDate}
              onChangeText={text => {
                setFormData({ ...formData, endDate: text });
                if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: '' });
              }}
            />
            {formErrors.endDate && <ThemedText style={styles.errorText}>{formErrors.endDate}</ThemedText>}

            <ThemedText style={styles.label}>Status</ThemedText>
            <View style={styles.statusButtons}>
              {(['draft', 'published'] as EventStatus[]).map(status => (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusButton, formData.status === status && styles.statusButtonActive]}
                  onPress={() => setFormData({ ...formData, status })}
                >
                  <ThemedText style={[styles.statusButtonText, formData.status === status && styles.statusButtonTextActive]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

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
  container: {
    flex: 1,
    backgroundColor: 'rgba(16, 22, 28, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    fontSize: 16,
    color: '#9bd8aa',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#2f7d46',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  createButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
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
  messageText: {
    color: '#ffffff',
    fontSize: 12,
  },
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.two,
  },
  info: {
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.one,
  },
  location: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: Spacing.one,
  },
  date: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: Spacing.one,
  },
  status: {
    fontSize: 11,
    color: 'rgba(194, 65, 58, 0.8)',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  published: {
    color: 'rgba(47, 125, 70, 0.8)',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: 'rgba(214, 166, 80, 0.3)',
  },
  deleteButton: {
    backgroundColor: 'rgba(194, 65, 58, 0.3)',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(16, 22, 28, 0.98)',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.6)',
  },
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
  errorText: { color: '#ff6b6b', fontSize: 11, marginBottom: Spacing.two, marginTop: -Spacing.one },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.78)',
    marginBottom: Spacing.two,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  statusButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#2f7d46',
    borderColor: '#9bd8aa',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2f7d46',
  },
});

export default AdminEvents;
