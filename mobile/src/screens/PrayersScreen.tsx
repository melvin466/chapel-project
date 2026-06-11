import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import prayerService, { PrayerRequest } from '../services/prayerService';
import { useAuth } from '@/context/AuthContext';

interface PrayersScreenProps {
  onBack: () => void;
}

const categories = ['personal', 'family', 'health', 'academic', 'financial', 'spiritual', 'other'];
const urgencies = ['normal', 'urgent', 'critical'];

export default function PrayersScreen({ onBack }: PrayersScreenProps) {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [activeTab, setActiveTab] = useState<'feed' | 'create'>('feed');
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('personal');
  const [urgency, setUrgency] = useState('normal');
  const [visibility, setVisibility] = useState('community');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadPrayers = async () => {
    try {
      setLoading(true);
      const response = await prayerService.getPrayerRequests({ limit: 50 });
      setPrayers(response.data?.prayerRequests || []);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load prayer requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'feed') {
      loadPrayers();
    }
  }, [activeTab]);

  const handleSubmit = async () => {
    setMessage(null);
    if (!title || !description) {
      setMessage({ type: 'error', text: 'Please fill in Title and Description.' });
      return;
    }

    setSubmitting(true);
    try {
      await prayerService.createPrayerRequest({
        title,
        description,
        category: category as any,
        urgency: urgency as any,
        visibility: visibility as any,
        isAnonymous,
      });

      setMessage({ type: 'success', text: 'Prayer request submitted successfully!' });
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('personal');
      setUrgency('normal');
      setVisibility('community');
      setIsAnonymous(false);

      setTimeout(() => {
        setActiveTab('feed');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePray = async (id: string) => {
    setActionLoading(id);
    setMessage(null);
    try {
      await prayerService.prayForRequest(id);
      setMessage({ type: 'success', text: 'Prayer recorded.' });
      loadPrayers();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not record prayer.' });
    } finally {
      setActionLoading(null);
    }
  };

  const getUrgencyStyle = (urgencyVal: string) => {
    switch (urgencyVal) {
      case 'critical':
        return styles.urgencyCritical;
      case 'urgent':
        return styles.urgencyUrgent;
      default:
        return styles.urgencyNormal;
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ThemedText type="smallBold" style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.title}>Prayer requests</ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          Share what you are carrying, and pray for others.
        </ThemedText>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'feed' && styles.tabButtonActive]}
          onPress={() => { setActiveTab('feed'); setMessage(null); }}
        >
          <ThemedText type="smallBold" style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>
            Pray for Others
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'create' && styles.tabButtonActive]}
          onPress={() => { setActiveTab('create'); setMessage(null); }}
        >
          <ThemedText type="smallBold" style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
            Request Prayer
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Message Banner */}
      {message && (
        <View style={[styles.messageCard, message.type === 'error' ? styles.errorCard : styles.successCard]}>
          <ThemedText style={styles.messageText}>{message.text}</ThemedText>
        </View>
      )}

      {activeTab === 'feed' ? (
        <View style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#2f7d46" style={styles.loader} />
          ) : prayers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText type="smallBold" style={styles.emptyTitle}>No prayers yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                No community prayer requests available at the moment.
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={prayers}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item: request }) => {
                const hasPrayed = request.viewerHasPrayed;
                const canPray = request.viewerCanPray && !hasPrayed;

                return (
                  <View style={styles.prayerCard}>
                    <View style={styles.cardHeader}>
                      <ThemedText type="smallBold" style={styles.prayerTitle}>
                        {request.title}
                      </ThemedText>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, getUrgencyStyle(request.urgency)]}>
                          <ThemedText type="code" style={styles.badgeText}>{request.urgency}</ThemedText>
                        </View>
                        <View style={styles.badge}>
                          <ThemedText type="code" style={[styles.badgeText, { color: '#ffffff' }]}>
                            {request.category}
                          </ThemedText>
                        </View>
                      </View>
                    </View>

                    <ThemedText type="small" style={styles.prayerDesc}>
                      {request.description}
                    </ThemedText>

                    <View style={styles.metaRow}>
                      {request.canViewPrayerCount && (
                        <ThemedText type="code" themeColor="textSecondary" style={styles.countText}>
                          {request.prayerCount || 0} {(request.prayerCount || 0) === 1 ? 'person has' : 'people have'} prayed
                        </ThemedText>
                      )}
                      <ThemedText type="code" themeColor="textSecondary" style={styles.authorText}>
                        Posted {request.isAnonymous ? 'Anonymously' : 'by member'}
                      </ThemedText>
                    </View>

                    {request.status === 'answered' && request.adminResponse && (
                      <View style={styles.adminAnswer}>
                        <ThemedText type="code" style={styles.adminAnswerLabel}>PASTORAL RESPONSE</ThemedText>
                        <ThemedText type="small" style={styles.adminAnswerText}>{request.adminResponse}</ThemedText>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.prayButton, hasPrayed && styles.prayButtonActive]}
                      disabled={!canPray || actionLoading === request._id}
                      onPress={() => handlePray(request._id)}
                    >
                      {actionLoading === request._id ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <ThemedText type="smallBold" style={styles.prayButtonText}>
                          {hasPrayed ? '✓ Prayed' : '🙏 Pray for this'}
                        </ThemedText>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
      ) : (
        /* Request Form */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <ThemedText type="smallBold" style={styles.inputLabel}>Title</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Brief summary (e.g. Healing for my mother)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={title}
              onChangeText={setTitle}
            />

            <ThemedText type="smallBold" style={styles.inputLabel}>What should we pray for?</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your request..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              numberOfLines={5}
              value={description}
              onChangeText={setDescription}
            />

            <ThemedText type="smallBold" style={styles.inputLabel}>Category</ThemedText>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                style={styles.picker}
                dropdownIconColor="#ffffff"
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat.toUpperCase()} value={cat} color="#ffffff" />
                ))}
              </Picker>
            </View>

            <ThemedText type="smallBold" style={styles.inputLabel}>Urgency</ThemedText>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={urgency}
                onValueChange={(itemValue) => setUrgency(itemValue)}
                style={styles.picker}
                dropdownIconColor="#ffffff"
              >
                {urgencies.map((urg) => (
                  <Picker.Item key={urg} label={urg.toUpperCase()} value={urg} color="#ffffff" />
                ))}
              </Picker>
            </View>

            <ThemedText type="smallBold" style={styles.inputLabel}>Visibility</ThemedText>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={visibility}
                onValueChange={(itemValue) => setVisibility(itemValue)}
                style={styles.picker}
                dropdownIconColor="#ffffff"
              >
                <Picker.Item label="WHOLE CHAPEL COMMUNITY" value="community" color="#ffffff" />
                <Picker.Item label="CHAPLAIN ONLY" value="chaplain" color="#ffffff" />
              </Picker>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchCol}>
                <ThemedText type="smallBold" style={styles.switchLabel}>Post Anonymously</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Keep your name hidden from records.</ThemedText>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#315f72', true: '#2f7d46' }}
                thumbColor={isAnonymous ? '#9bd8aa' : '#b0b4ba'}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText type="smallBold" style={styles.submitButtonText}>Submit Request</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  prayerCard: {
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
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  prayerTitle: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
    marginRight: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  urgencyNormal: {
    borderColor: 'rgba(47, 125, 70, 0.3)',
    backgroundColor: 'rgba(47, 125, 70, 0.12)',
  },
  urgencyUrgent: {
    borderColor: 'rgba(214, 166, 80, 0.3)',
    backgroundColor: 'rgba(214, 166, 80, 0.12)',
  },
  urgencyCritical: {
    borderColor: 'rgba(194, 65, 58, 0.3)',
    backgroundColor: 'rgba(194, 65, 58, 0.12)',
  },
  prayerDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: Spacing.three,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  countText: {
    fontSize: 11,
    color: '#9bd8aa',
  },
  authorText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  adminAnswer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftWidth: 2,
    borderLeftColor: '#d6a650',
    padding: Spacing.two,
    borderRadius: Spacing.one,
    marginBottom: Spacing.three,
  },
  adminAnswerLabel: {
    color: '#d6a650',
    fontSize: 9,
    marginBottom: 2,
  },
  adminAnswerText: {
    fontSize: 13,
    color: '#ffffff',
  },
  prayButton: {
    backgroundColor: '#315f72',
    borderWidth: 1,
    borderColor: 'rgba(49, 95, 114, 0.4)',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayButtonActive: {
    backgroundColor: 'rgba(47, 125, 70, 0.2)',
    borderColor: 'rgba(47, 125, 70, 0.4)',
  },
  prayButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.four,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.two,
    marginBottom: Spacing.three,
    overflow: 'hidden',
  },
  picker: {
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.two,
    paddingBottom: Spacing.three,
  },
  switchCol: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  switchLabel: {
    color: '#ffffff',
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
