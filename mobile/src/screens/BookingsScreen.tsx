import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import bookingService, { Booking } from '../services/bookingService';
import { useAuth } from '@/context/AuthContext';

interface BookingsScreenProps {
  onBack: () => void;
}

const bookingTypes = [
  {
    value: 'counselling',
    label: 'Counselling',
    description: 'Private pastoral conversation for prayer, guidance, or support.',
    color: '#9bd8aa',
  },
  {
    value: 'wedding',
    label: 'Wedding',
    description: 'Chapel ceremony, marriage preparation, or guidance.',
    color: '#d6a650',
  },
  {
    value: 'baptism',
    label: 'Baptism',
    description: 'Coordinate baptism details and preparation classes.',
    color: '#315f72',
  },
  {
    value: 'facility',
    label: 'Facility use',
    description: 'Request chapel space for fellowships or fellowships.',
    color: '#2f7d46',
  },
  {
    value: 'appointment',
    label: 'Chaplain appointment',
    description: 'Spiritual direction or guidance with a chaplain.',
    color: '#b0b4ba',
  },
];

export default function BookingsScreen({ onBack }: BookingsScreenProps) {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [bookingType, setBookingType] = useState('counselling');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [purpose, setPurpose] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const loadBookings = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings();
      setBookings(response.data?.bookings || []);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not load your bookings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      loadBookings();
    }
  }, [activeTab]);

  const handleSubmit = async () => {
    setMessage(null);
    if (!isAuthenticated) {
      setMessage({ type: 'error', text: 'You must be logged in to create a booking request.' });
      return;
    }

    if (!requestedDate || !requestedTime || !purpose) {
      setMessage({ type: 'error', text: 'Please fill in Date, Time, and Purpose.' });
      return;
    }

    setSubmitting(true);
    try {
      await bookingService.createBooking({
        bookingType: bookingType as any,
        requestedDate,
        requestedTime,
        numberOfPeople: parseInt(numberOfPeople, 10) || 1,
        purpose,
        specialRequests,
      });

      setMessage({ type: 'success', text: 'Booking request sent successfully!' });
      // Reset form
      setBookingType('counselling');
      setRequestedDate('');
      setRequestedTime('');
      setNumberOfPeople('1');
      setPurpose('');
      setSpecialRequests('');

      // Navigate to list
      setTimeout(() => {
        setActiveTab('list');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit booking.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    setMessage(null);
    try {
      await bookingService.cancelBooking(id);
      setMessage({ type: 'success', text: 'Booking cancelled successfully.' });
      loadBookings();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not cancel booking.' });
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return styles.statusApproved;
      case 'denied':
        return styles.statusDenied;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const selectedTypeDetails = bookingTypes.find((t) => t.value === bookingType) || bookingTypes[0];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ThemedText type="smallBold" style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.title}>Book Support</ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          Schedule pastoral care, chapel bookings, or ceremonies.
        </ThemedText>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'create' && styles.tabButtonActive]}
          onPress={() => { setActiveTab('create'); setMessage(null); }}
        >
          <ThemedText type="smallBold" style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
            Request Booking
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'list' && styles.tabButtonActive]}
          onPress={() => { setActiveTab('list'); setMessage(null); }}
        >
          <ThemedText type="smallBold" style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>
            My Requests
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Message Banner */}
      {message && (
        <View style={[styles.messageCard, message.type === 'error' ? styles.errorCard : styles.successCard]}>
          <ThemedText style={styles.messageText}>{message.text}</ThemedText>
        </View>
      )}

      {activeTab === 'create' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Booking Type Showcase */}
          <ThemedText type="smallBold" style={styles.label}>Select Service Type</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.showcaseWrapper}>
            {bookingTypes.map((type) => {
              const isSelected = bookingType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.showcaseCard, isSelected && styles.showcaseCardActive]}
                  onPress={() => setBookingType(type.value)}
                >
                  <View style={[styles.colorIndicator, { backgroundColor: type.color }]} />
                  <ThemedText type="smallBold" style={styles.showcaseTitle}>{type.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={3} style={styles.showcaseDesc}>
                    {type.description}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.selectedHeading}>
              <ThemedText type="smallBold" style={{ color: selectedTypeDetails.color }}>
                {selectedTypeDetails.label.toUpperCase()}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.selectedSub}>
                {selectedTypeDetails.description}
              </ThemedText>
            </View>

            <ThemedText type="smallBold" style={styles.inputLabel}>Requested Date</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g. YYYY-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={requestedDate}
              onChangeText={setRequestedDate}
            />

            <ThemedText type="smallBold" style={styles.inputLabel}>Requested Time</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g. HH:MM (e.g. 10:00 AM)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={requestedTime}
              onChangeText={setRequestedTime}
            />

            <ThemedText type="smallBold" style={styles.inputLabel}>Number of People attending</ThemedText>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="e.g. 1"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={numberOfPeople}
              onChangeText={setNumberOfPeople}
            />

            <UrbanTextArea
              label="Purpose / Detailed Needs"
              placeholder="Detail your request, conversation topics, or details for the wedding ceremony..."
              value={purpose}
              onChangeText={setPurpose}
            />

            <UrbanTextArea
              label="Special Requests / Notes"
              placeholder="Special support, timing details, or accessibility considerations..."
              value={specialRequests}
              onChangeText={setSpecialRequests}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText type="smallBold" style={styles.submitButtonText}>Submit Request</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* Requests List */
        <View style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#2f7d46" style={styles.loader} />
          ) : !isAuthenticated ? (
            <View style={styles.emptyContainer}>
              <ThemedText type="smallBold" style={styles.emptyTitle}>Sign in required</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                You must sign in to your member account to view booking requests.
              </ThemedText>
            </View>
          ) : bookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText type="smallBold" style={styles.emptyTitle}>No booking requests found</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Once you submit a booking request, they will be listed here.
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={bookings}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item: booking }) => {
                const formattedType = bookingTypes.find((t) => t.value === booking.bookingType)?.label || booking.bookingType;

                const showCancel = ['pending', 'approved'].includes(booking.status);

                return (
                  <View style={styles.bookingCard}>
                    <View style={styles.cardHeader}>
                      <ThemedText type="smallBold" style={styles.bookingTitle}>
                        {formattedType}
                      </ThemedText>
                      <View style={[styles.statusBadge, getStatusStyle(booking.status)]}>
                        <ThemedText type="code" style={styles.statusText}>{booking.status}</ThemedText>
                      </View>
                    </View>

                    <ThemedText type="small" themeColor="textSecondary" style={styles.bookingDetails}>
                      🗓 {booking.requestedDate} at {booking.requestedTime} · 👥 {booking.numberOfPeople} people
                    </ThemedText>

                    <ThemedText type="small" style={styles.bookingPurpose}>
                      {booking.purpose}
                    </ThemedText>

                    {booking.specialRequests && (
                      <View style={styles.notesBox}>
                        <ThemedText type="code" style={styles.notesLabel}>SPECIAL REQUESTS</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary" style={styles.notesVal}>
                          {booking.specialRequests}
                        </ThemedText>
                      </View>
                    )}

                    {booking.reviewReason && (
                      <View style={styles.reviewBox}>
                        <ThemedText type="code" style={styles.reviewLabel}>
                          {booking.status === 'denied' ? 'Reason Denied' : 'Review Note'}
                        </ThemedText>
                        <ThemedText type="small" style={styles.reviewVal}>
                          {booking.reviewReason}
                        </ThemedText>
                        {booking.reviewedBy && (
                          <ThemedText type="code" style={styles.reviewedBy}>
                            Reviewed by {booking.reviewedBy.firstName} {booking.reviewedBy.lastName}
                          </ThemedText>
                        )}
                      </View>
                    )}

                    {showCancel && (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking._id)}
                      >
                        <ThemedText type="smallBold" style={styles.cancelButtonText}>Cancel Request</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
          )}
        </View>
      )}
    </ThemedView>
  );
}

// Simple Helper Component for textareas
function UrbanTextArea({ label, placeholder, value, onChangeText }: { label: string; placeholder: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={styles.textAreaWrapper}>
      <ThemedText type="smallBold" style={styles.inputLabel}>{label}</ThemedText>
      <TextInput
        style={styles.textArea}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
        multiline
        numberOfLines={4}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
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
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Spacing.two,
    padding: 4,
    marginBottom: Spacing.four,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: Spacing.one + 2,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(47, 125, 70, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(155, 216, 170, 0.3)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  label: {
    color: '#ffffff',
    marginBottom: Spacing.two,
  },
  showcaseWrapper: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
    marginBottom: Spacing.three,
  },
  showcaseCard: {
    width: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  showcaseCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: '#9bd8aa',
  },
  colorIndicator: {
    height: 4,
    width: 32,
    borderRadius: 2,
    marginBottom: Spacing.two,
  },
  showcaseTitle: {
    color: '#ffffff',
    marginBottom: 4,
  },
  showcaseDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.four,
  },
  selectedHeading: {
    marginBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: Spacing.two,
  },
  selectedSub: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 13,
    marginBottom: Spacing.one,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    color: '#ffffff',
    fontSize: 15,
    marginBottom: Spacing.three,
  },
  textAreaWrapper: {
    marginBottom: Spacing.three,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    color: '#ffffff',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2f7d46',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
  bookingCard: {
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
  bookingTitle: {
    color: '#ffffff',
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  statusPending: {
    backgroundColor: 'rgba(214, 166, 80, 0.2)',
  },
  statusApproved: {
    backgroundColor: 'rgba(47, 125, 70, 0.2)',
  },
  statusDenied: {
    backgroundColor: 'rgba(194, 65, 58, 0.2)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(176, 180, 186, 0.2)',
  },
  bookingDetails: {
    fontSize: 13,
    marginBottom: Spacing.two,
  },
  bookingPurpose: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: Spacing.two,
  },
  notesBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftWidth: 2,
    borderLeftColor: '#315f72',
    padding: Spacing.two,
    borderRadius: Spacing.one,
    marginBottom: Spacing.two,
  },
  notesLabel: {
    color: '#315f72',
    fontSize: 9,
    marginBottom: 2,
  },
  notesVal: {
    fontSize: 12,
  },
  reviewBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftWidth: 2,
    borderLeftColor: '#d6a650',
    padding: Spacing.two,
    borderRadius: Spacing.one,
    marginBottom: Spacing.two,
  },
  reviewLabel: {
    color: '#d6a650',
    fontSize: 9,
    marginBottom: 2,
  },
  reviewVal: {
    fontSize: 13,
    color: '#ffffff',
  },
  reviewedBy: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    marginTop: 4,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(194, 65, 58, 0.4)',
    backgroundColor: 'rgba(194, 65, 58, 0.08)',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  cancelButtonText: {
    color: '#ff6b6b',
    fontSize: 13,
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
