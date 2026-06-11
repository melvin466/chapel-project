import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';

// Import Screens
import CellsScreen from '../screens/CellsScreen';
import BookingsScreen from '../screens/BookingsScreen';
import PrayersScreen from '../screens/PrayersScreen';
import SermonsScreen from '../screens/SermonsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

type ViewType = 'menu' | 'cells' | 'bookings' | 'prayers' | 'sermons' | 'feedback' | 'notifications';

export default function ExploreScreen() {
  const params = useLocalSearchParams();
  const [activeView, setActiveView] = useState<ViewType>('menu');

  useEffect(() => {
    if (params?.view && typeof params.view === 'string') {
      setActiveView(params.view as ViewType);
    }
  }, [params?.view]);

  const handleOpenLink = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  if (activeView === 'cells') {
    return <CellsScreen onBack={() => setActiveView('menu')} />;
  }

  if (activeView === 'bookings') {
    return <BookingsScreen onBack={() => setActiveView('menu')} />;
  }

  if (activeView === 'prayers') {
    return <PrayersScreen onBack={() => setActiveView('menu')} />;
  }

  if (activeView === 'sermons') {
    return <SermonsScreen onBack={() => setActiveView('menu')} />;
  }

  if (activeView === 'feedback') {
    return <FeedbackScreen onBack={() => setActiveView('menu')} />;
  }

  if (activeView === 'notifications') {
    return (
      <NotificationsScreen
        onBack={() => setActiveView('menu')}
        onNavigate={(view) => setActiveView(view)}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>Explore Chapel</ThemedText>
            <ThemedText style={styles.subtitle} themeColor="textSecondary">
              Access all Chapel System resources and settings.
            </ThemedText>
          </View>

          <View style={styles.gridContainer}>
            {/* Cell Groups Card */}
            <TouchableOpacity style={styles.menuCard} onPress={() => setActiveView('cells')}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(155, 216, 170, 0.12)' }]}>
                <SymbolView tintColor="#9bd8aa" name="person.3" size={22} />
              </View>
              <View style={styles.cardInfo}>
                <ThemedText type="smallBold" style={styles.cardTitle}>Cell Groups</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.cardDesc}>
                  Join a smaller home fellowship near you.
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Bookings Card */}
            <TouchableOpacity style={styles.menuCard} onPress={() => setActiveView('bookings')}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(214, 166, 80, 0.12)' }]}>
                <SymbolView tintColor="#d6a650" name="calendar" size={22} />
              </View>
              <View style={styles.cardInfo}>
                <ThemedText type="smallBold" style={styles.cardTitle}>Bookings</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.cardDesc}>
                  Request counseling, sacraments, or space.
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Prayer Requests Card */}
            <TouchableOpacity style={styles.menuCard} onPress={() => setActiveView('prayers')}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(49, 95, 114, 0.12)' }]}>
                <SymbolView tintColor="#315f72" name="heart" size={22} />
              </View>
              <View style={styles.cardInfo}>
                <ThemedText type="smallBold" style={styles.cardTitle}>Prayers</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.cardDesc}>
                  Share requests or pray for the community.
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Sermons Card */}
            <TouchableOpacity style={styles.menuCard} onPress={() => setActiveView('sermons')}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(47, 125, 70, 0.12)' }]}>
                <SymbolView tintColor="#2f7d46" name="book.closed" size={22} />
              </View>
              <View style={styles.cardInfo}>
                <ThemedText type="smallBold" style={styles.cardTitle}>Sermons</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.cardDesc}>
                  Stream and replay preaching teaching notes.
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Notifications Card */}
            <TouchableOpacity style={styles.menuCard} onPress={() => setActiveView('notifications')}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                <SymbolView tintColor="#ffffff" name="bell" size={22} />
              </View>
              <View style={styles.cardInfo}>
                <ThemedText type="smallBold" style={styles.cardTitle}>Notifications</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.cardDesc}>
                  Check messages and booking updates.
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Feedback Card */}
            <TouchableOpacity style={styles.menuCard} onPress={() => setActiveView('feedback')}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(176, 180, 186, 0.12)' }]}>
                <SymbolView tintColor="#b0b4ba" name="bubble.left" size={22} />
              </View>
              <View style={styles.cardInfo}>
                <ThemedText type="smallBold" style={styles.cardTitle}>Feedback</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.cardDesc}>
                  Send suggestions directly to chapel office.
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          {/* Contact Section */}
          <View style={styles.contactSection}>
            <ThemedText type="smallBold" style={styles.contactTitle}>Contact Chapel Office</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.contactDesc}>
              Have any direct questions? Reach the admin office.
            </ThemedText>
            <TouchableOpacity style={styles.linkButton} onPress={() => handleOpenLink('mailto:managementchapel98@gmail.com')}>
              <ThemedText type="smallBold" style={styles.linkText}>Email Administration</ThemedText>
              <SymbolView tintColor="#9bd8aa" name="envelope" size={14} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10161c',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    marginVertical: Spacing.four,
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: Spacing.two,
    fontWeight: '800',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  gridContainer: {
    gap: Spacing.three,
  },
  menuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconBox: {
    height: 48,
    width: 48,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  contactSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.four,
    marginTop: Spacing.five,
  },
  contactTitle: {
    color: '#ffffff',
    marginBottom: 2,
  },
  contactDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    backgroundColor: 'rgba(47, 125, 70, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(47, 125, 70, 0.3)',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  linkText: {
    color: '#9bd8aa',
  },
});
