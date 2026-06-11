import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import eventService, { Event } from '../services/eventService';
import announcementService, { Announcement } from '../services/announcementService';

const backgroundUrl = 'https://images.pexels.com/photos/2570062/pexels-photo-2570062.jpeg?auto=compress&cs=tinysrgb&w=1200';
const eventFallbackImage = 'https://images.pexels.com/photos/267559/pexels-photo-267559.jpeg?auto=compress&cs=tinysrgb&w=600';
const announcementFallbackImage = 'https://images.pexels.com/photos/208315/pexels-photo-208315.jpeg?auto=compress&cs=tinysrgb&w=600';

const scriptureVerses = [
  { reference: 'Psalm 118:24', text: 'This is the day that Yahweh has made. We will rejoice and be glad in it.' },
  { reference: 'Proverbs 3:5-6', text: 'Trust in Yahweh with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.' },
  { reference: 'Isaiah 40:31', text: 'Those who wait for Yahweh will renew their strength. They will mount up with wings like eagles.' },
  { reference: 'Matthew 5:16', text: 'Even so, let your light shine before men, that they may see your good works and glorify your Father who is in heaven.' },
  { reference: 'John 14:27', text: 'Peace I leave with you. My peace I give to you; not as the world gives, I give to you.' },
  { reference: 'Romans 12:12', text: 'Rejoicing in hope, enduring in troubles, continuing steadfastly in prayer.' },
  { reference: 'Philippians 4:6-7', text: 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.' },
  { reference: 'Colossians 3:23', text: 'And whatever you do, work heartily, as for the Lord and not for men.' },
  { reference: 'James 1:5', text: 'But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach.' },
  { reference: '1 Peter 5:7', text: 'Casting all your worries on him, because he cares for you.' },
];

const getDayOfYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ events: 0, updates: 0 });
  const isChapelLeader = user?.role === 'chapel_leader';

  const verse = scriptureVerses[getDayOfYear() % scriptureVerses.length];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await eventService.getEvents({ limit: 3 });
        const announcementsRes = await announcementService.getAnnouncements({ limit: 3 });

        setEvents(eventsRes.data?.events || []);
        setAnnouncements(announcementsRes.data?.announcements || []);
        setStats({
          events: eventsRes.data?.pagination?.total || eventsRes.data?.events?.length || 0,
          updates: announcementsRes.data?.pagination?.total || announcementsRes.data?.announcements?.length || 0,
        });
      } catch (error) {
        console.error('Error loading data for homepage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Background image & Hero section */}
        <ImageBackground source={{ uri: backgroundUrl }} style={styles.heroBackground} imageStyle={styles.heroBackgroundImage}>
          <View style={styles.gradientOverlay}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.heroContent}>
                <ThemedText type="smallBold" style={[styles.eyebrow, isChapelLeader && styles.leaderEyebrow]}>
                  {isChapelLeader ? 'Chapel Leader' : 'Chapel System'}
                </ThemedText>
                <ThemedText type="title" style={styles.heroTitle}>
                  {isChapelLeader ? 'Lead with presence, worship, and care.' : 'Worship, community, and care in one living system.'}
                </ThemedText>
                <ThemedText style={styles.heroDesc} themeColor="textSecondary">
                  {isChapelLeader ? 'Stay close to chapel life, support your community, and keep your own spiritual rhythm steady.' : 'Follow chapel events, read announcements, request prayer, and give securely from one place.'}
                </ThemedText>

                {/* Today at Chapel glass panel */}
                <View style={styles.glassPanel}>
                  <ThemedText type="smallBold" style={styles.panelLabel}>TODAY AT CHAPEL</ThemedText>
                  <View style={styles.serviceRow}>
                    <ThemedText type="smallBold" style={styles.serviceTitle}>Weekday Mass</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">7:00 AM & 12:10 PM</ThemedText>
                  </View>
                  <View style={styles.serviceRow}>
                    <ThemedText type="smallBold" style={styles.serviceTitle}>Wednesday Fellowship</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">5:30 PM</ThemedText>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText type="subtitle" style={styles.statNumber}>{stats.events}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">Upcoming</ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText type="subtitle" style={styles.statNumber}>{stats.updates}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">Updates</ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>

        {isChapelLeader && (
          <View style={styles.leaderBand}>
            <ThemedText type="smallBold" style={styles.leaderBandTitle}>CHAPEL LEADER SPACE</ThemedText>
            <ThemedText type="small" style={styles.leaderBandText}>
              A focused view for service, care, and steady connection with the chapel community.
            </ThemedText>
          </View>
        )}

        {/* Action Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.replace('/give')}>
            <ThemedText type="smallBold" style={styles.actionKicker}>Give</ThemedText>
            <ThemedText type="smallBold" style={styles.actionTitle}>Support the mission</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.actionDesc}>
              Use MTN or Airtel Mobile Money giving.
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.replace('/explore?view=bookings')}>
            <ThemedText type="smallBold" style={[styles.actionKicker, { color: '#d6a650' }]}>Book</ThemedText>
            <ThemedText type="smallBold" style={styles.actionTitle}>Request support</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.actionDesc}>
              Plan counselling, facility, or appointment requests.
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.replace('/explore?view=cells')}>
            <ThemedText type="smallBold" style={[styles.actionKicker, { color: '#315f72' }]}>Connect</ThemedText>
            <ThemedText type="smallBold" style={styles.actionTitle}>Join a cell group</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.actionDesc}>
              Find a smaller community for fellowship.
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Verse of the day */}
        <View style={styles.verseCard}>
          <ThemedText type="smallBold" style={styles.verseKicker}>VERSE OF THE DAY</ThemedText>
          <ThemedText type="subtitle" style={styles.verseRef}>{verse.reference}</ThemedText>
          <ThemedText style={styles.verseText}>"{verse.text}"</ThemedText>
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <ThemedText type="smallBold" style={styles.sectionKicker}>UPCOMING AT CHAPEL</ThemedText>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Events Feed</ThemedText>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#2f7d46" style={styles.loader} />
          ) : events.length > 0 ? (
            events.map((event) => (
              <View key={event._id} style={styles.eventCard}>
                <Image
                  source={{ uri: event.featuredImage || eventFallbackImage }}
                  style={styles.eventImage}
                  contentFit="cover"
                />
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <ThemedText type="smallBold" style={styles.eventTitle}>{event.title}</ThemedText>
                    <View style={styles.dateBadge}>
                      <ThemedText type="code" style={styles.dateBadgeText}>
                        {formatDate(event.startDate)}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.eventDesc}>
                    {event.description}
                  </ThemedText>
                  {event.location && (
                    <ThemedText type="code" style={styles.eventLoc}>
                      📍 {event.location}
                    </ThemedText>
                  )}
                </View>
              </View>
            ))
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No upcoming events at the moment.
            </ThemedText>
          )}
        </View>

        {/* Announcements */}
        <View style={[styles.section, styles.sectionAlt]}>
          <View style={styles.sectionHeader}>
            <View>
              <ThemedText type="smallBold" style={styles.sectionKicker}>LATEST NOTICES</ThemedText>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Announcements</ThemedText>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#2f7d46" style={styles.loader} />
          ) : announcements.length > 0 ? (
            announcements.map((announcement) => (
              <View key={announcement._id} style={styles.announcementCard}>
                <View style={styles.announcementTop}>
                  <View style={[styles.priorityBadge, styles[`priority-${announcement.priority || 'medium'}`]]}>
                    <ThemedText type="code" style={styles.priorityText}>
                      {(announcement.priority || 'medium').toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText type="code" style={styles.announcementDate}>
                    {new Date(announcement.publishDate || announcement.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.announcementTitle}>{announcement.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={3} style={styles.announcementText}>
                  {announcement.summary || announcement.content}
                </ThemedText>
              </View>
            ))
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No announcements available yet.
            </ThemedText>
          )}
        </View>

        {/* Timetable section */}
        <View style={styles.timetableSection}>
          <ThemedText type="smallBold" style={styles.timetableKicker}>SERVICE RHYTHM</ThemedText>
          <ThemedText type="subtitle" style={styles.timetableTitle}>Gather Through the Week</ThemedText>

          <View style={styles.timetableRow}>
            <ThemedText type="smallBold" style={styles.timetableDay}>Sunday Services</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.timetableTime}>
              8:00 AM, 10:00 AM, 5:00 PM
            </ThemedText>
          </View>
          <View style={styles.timetableRow}>
            <ThemedText type="smallBold" style={styles.timetableDay}>Weekday Mass</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.timetableTime}>
              7:00 AM & 12:10 PM
            </ThemedText>
          </View>
          <View style={styles.timetableRow}>
            <ThemedText type="smallBold" style={styles.timetableDay}>Wednesday Fellowship</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.timetableTime}>
              5:30 PM
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10161c',
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  heroBackground: {
    width: '100%',
    minHeight: Dimensions.get('window').height * 0.7,
  },
  heroBackgroundImage: {
    opacity: 0.25,
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 22, 28, 0.82)',
  },
  safeArea: {
    flex: 1,
  },
  heroContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  eyebrow: {
    color: '#9bd8aa',
    letterSpacing: 1.5,
    marginBottom: Spacing.two,
    textTransform: 'uppercase',
  },
  leaderEyebrow: {
    color: '#d6a650',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 44,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  heroDesc: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.four,
  },
  glassPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    marginTop: Spacing.two,
  },
  panelLabel: {
    color: '#d6a650',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: Spacing.two,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.one,
  },
  serviceTitle: {
    color: '#ffffff',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: Spacing.three,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionGrid: {
    paddingHorizontal: Spacing.four,
    marginTop: -Spacing.five,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  leaderBand: {
    backgroundColor: 'rgba(214, 166, 80, 0.12)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(214, 166, 80, 0.28)',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  leaderBandTitle: {
    color: '#d6a650',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: Spacing.one,
  },
  leaderBandText: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 13,
    lineHeight: 18,
  },
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.four,
  },
  actionKicker: {
    color: '#9bd8aa',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: Spacing.one,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: Spacing.one,
  },
  actionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  verseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftWidth: 3,
    borderLeftColor: '#d6a650',
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.four,
    padding: Spacing.four,
    borderRadius: Spacing.two,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  verseKicker: {
    color: '#d6a650',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: Spacing.one,
  },
  verseRef: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  verseText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  sectionAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: Spacing.five,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  sectionKicker: {
    color: '#9bd8aa',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  sectionTitle: {
    color: '#ffffff',
    fontWeight: '800',
  },
  loader: {
    marginVertical: Spacing.four,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacing.three,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 140,
  },
  eventContent: {
    padding: Spacing.three,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.one,
  },
  eventTitle: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
    marginRight: Spacing.two,
  },
  dateBadge: {
    backgroundColor: 'rgba(47, 125, 70, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(47, 125, 70, 0.4)',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  dateBadgeText: {
    color: '#9bd8aa',
    fontSize: 11,
  },
  eventDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  eventLoc: {
    color: '#d6a650',
    fontSize: 12,
  },
  announcementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#2f7d46',
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  announcementTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 10,
  },
  'priority-critical': {
    backgroundColor: 'rgba(194, 65, 58, 0.2)',
  },
  'priority-high': {
    backgroundColor: 'rgba(214, 166, 80, 0.2)',
  },
  'priority-medium': {
    backgroundColor: 'rgba(49, 95, 114, 0.2)',
  },
  'priority-low': {
    backgroundColor: 'rgba(47, 125, 70, 0.2)',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  announcementDate: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
  },
  announcementTitle: {
    color: '#ffffff',
    fontSize: 15,
    marginBottom: Spacing.one,
  },
  announcementText: {
    fontSize: 13,
    lineHeight: 18,
  },
  timetableSection: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  timetableKicker: {
    color: '#d6a650',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  timetableTitle: {
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: Spacing.three,
  },
  timetableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  timetableDay: {
    color: '#ffffff',
    fontSize: 14,
  },
  timetableTime: {
    fontSize: 13,
  },
});
