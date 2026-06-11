import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Linking,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import sermonService, { Sermon } from '../services/sermonService';
import { useAuth } from '@/context/AuthContext';

interface SermonsScreenProps {
  onBack: () => void;
}

const fallbackSermonImage = 'https://images.pexels.com/photos/8468474/pexels-photo-8468474.jpeg?auto=compress&cs=tinysrgb&w=600';

export default function SermonsScreen({ onBack }: SermonsScreenProps) {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('latest');
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSermons = async () => {
    try {
      setLoading(true);
      const response = await sermonService.getSermons({ limit: 100 });
      setSermons(response.data?.sermons || []);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not load sermons.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSermons();
  }, []);

  const loadSermonDetails = async (id: string) => {
    try {
      setDetailLoading(true);
      const response = await sermonService.getSermonById(id);
      setSelectedSermon(response.data.sermon);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load sermon details.' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleLike = async (id: string) => {
    if (!isAuthenticated) {
      setMessage({ type: 'error', text: 'Please log in to like this sermon.' });
      return;
    }

    setLikeLoading(true);
    try {
      const response = await sermonService.likeSermon(id);
      setMessage({
        type: 'success',
        text: response.liked ? 'Sermon added to your likes.' : 'Sermon removed from your likes.',
      });
      // reload details
      loadSermonDetails(id);
      // reload list in background
      loadSermons();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not update like status.' });
    } finally {
      setLikeLoading(false);
    }
  };

  const filterOptions = useMemo(() => {
    const serviceTypes = Array.from(new Set(sermons.map((s) => s.serviceType).filter(Boolean)));
    const series = Array.from(new Set(sermons.map((s) => s.series).filter(Boolean)));
    return [
      { id: 'latest', label: 'Latest' },
      { id: 'video', label: 'Video' },
      { id: 'audio', label: 'Audio' },
      ...serviceTypes.slice(0, 2).map((item) => ({ id: `service:${item}`, label: item || 'Service' })),
      ...series.slice(0, 2).map((item) => ({ id: `series:${item}`, label: item || 'Series' })),
    ];
  }, [sermons]);

  const filteredSermons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sermons.filter((sermon) => {
      const searchText = [
        sermon.title,
        sermon.speaker,
        sermon.description,
        sermon.series,
        sermon.serviceType,
        ...(sermon.bibleVerses || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesQuery = !query || searchText.includes(query);
      const matchesFilter =
        activeFilter === 'latest' ||
        (activeFilter === 'video' && Boolean(sermon.videoUrl)) ||
        (activeFilter === 'audio' && Boolean(sermon.audioUrl)) ||
        (activeFilter.startsWith('service:') &&
          sermon.serviceType === activeFilter.replace('service:', '')) ||
        (activeFilter.startsWith('series:') &&
          sermon.series === activeFilter.replace('series:', ''));

      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, searchQuery, sermons]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleOpenMedia = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch((err) => console.error('An error occurred opening URL', err));
  };

  if (selectedSermon) {
    const posterName = selectedSermon.createdBy
      ? `${selectedSermon.createdBy.firstName || ''} ${selectedSermon.createdBy.lastName || ''}`.trim()
      : selectedSermon.speaker;

    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => { setSelectedSermon(null); setMessage(null); }}>
              <ThemedText type="smallBold" style={styles.backButtonText}>← Back to Library</ThemedText>
            </TouchableOpacity>
          </View>

          {message && (
            <View style={[styles.messageCard, message.type === 'error' ? styles.errorCard : styles.successCard]}>
              <ThemedText style={styles.messageText}>{message.text}</ThemedText>
            </View>
          )}

          {/* Hero details */}
          <ImageBackground
            source={{ uri: selectedSermon.thumbnail || fallbackSermonImage }}
            style={styles.detailHero}
            imageStyle={styles.detailHeroImage}
          >
            <View style={styles.detailHeroOverlay}>
              <View style={styles.detailHeroContent}>
                <View style={styles.categoryBadge}>
                  <ThemedText type="code" style={styles.categoryBadgeText}>
                    {selectedSermon.series || selectedSermon.serviceType || 'MESSAGE'}
                  </ThemedText>
                </View>
                <ThemedText type="subtitle" style={styles.detailHeroTitle}>
                  {selectedSermon.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.detailSpeaker}>
                  Preached by {selectedSermon.speaker}
                </ThemedText>
              </View>
            </View>
          </ImageBackground>

          {/* Details Body */}
          <View style={styles.detailBody}>
            {/* Meta Box */}
            <View style={styles.metaBox}>
              <ThemedText type="small" style={styles.metaRowLabel}>
                🗓 Date: <ThemedText type="smallBold">{formatDate(selectedSermon.date)}</ThemedText>
              </ThemedText>
              {selectedSermon.duration && (
                <ThemedText type="small" style={styles.metaRowLabel}>
                  ⏱ Duration: <ThemedText type="smallBold">{selectedSermon.duration} minutes</ThemedText>
                </ThemedText>
              )}
              <ThemedText type="small" style={styles.metaRowLabel}>
                ✍️ Posted by: <ThemedText type="smallBold">{posterName}</ThemedText>
              </ThemedText>
            </View>

            {/* Description */}
            <ThemedText type="smallBold" style={styles.sectionHeading}>Summary / Notes</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.descriptionText}>
              {selectedSermon.description}
            </ThemedText>

            {/* Scripture */}
            {selectedSermon.bibleVerses && selectedSermon.bibleVerses.length > 0 && (
              <View style={styles.versesBox}>
                <ThemedText type="smallBold" style={[styles.sectionHeading, { color: '#d6a650' }]}>Scripture Verses</ThemedText>
                {selectedSermon.bibleVerses.map((verse, idx) => (
                  <ThemedText key={idx} type="small" style={styles.verseText}>
                    📖 {verse}
                  </ThemedText>
                ))}
              </View>
            )}

            {/* Audio Stream Button */}
            {selectedSermon.audioUrl && (
              <View style={styles.mediaBlock}>
                <ThemedText type="smallBold" style={styles.sectionHeading}>Audio Teaching</ThemedText>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={() => handleOpenMedia(selectedSermon.audioUrl)}
                >
                  <ThemedText type="smallBold" style={styles.mediaButtonText}>🎧 Stream Audio Message</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {/* Video Stream Button */}
            {selectedSermon.videoUrl && (
              <View style={styles.mediaBlock}>
                <ThemedText type="smallBold" style={styles.sectionHeading}>Video Teaching</ThemedText>
                <TouchableOpacity
                  style={[styles.mediaButton, { backgroundColor: '#315f72' }]}
                  onPress={() => handleOpenMedia(selectedSermon.videoUrl)}
                >
                  <ThemedText type="smallBold" style={styles.mediaButtonText}>🎥 Watch Video Sermon</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {/* Like Action */}
            <TouchableOpacity
              style={[styles.likeButton, likeLoading && styles.likeButtonDisabled]}
              onPress={() => handleLike(selectedSermon._id)}
              disabled={likeLoading}
            >
              {likeLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText type="smallBold" style={styles.likeButtonText}>
                  ❤️ {selectedSermon.likes?.length || 0} Likes
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ThemedText type="smallBold" style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.title}>Sermons Feed</ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          Watch, listen, and revisit chapel teaching.
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
        placeholder="Search title, preacher, topic..."
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Filter Row */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map((opt) => {
            const isSelected = activeFilter === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setActiveFilter(opt.id)}
              >
                <ThemedText type="smallBold" style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {opt.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sermons List */}
      {loading ? (
        <ActivityIndicator size="large" color="#2f7d46" style={styles.loader} />
      ) : filteredSermons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText type="smallBold" style={styles.emptyTitle}>No sermons found</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Try another search keyword or filter type.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredSermons}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: sermon }) => {
            const hasVideo = Boolean(sermon.videoUrl);
            const hasAudio = Boolean(sermon.audioUrl);

            let formatLabel = 'Read notes';
            if (hasVideo && hasAudio) formatLabel = 'Watch or listen';
            else if (hasVideo) formatLabel = 'Watch';
            else if (hasAudio) formatLabel = 'Listen';

            return (
              <TouchableOpacity
                style={styles.sermonCard}
                onPress={() => loadSermonDetails(sermon._id)}
              >
                <View style={styles.sermonMetaLine}>
                  <ThemedText type="code" style={styles.sermonSeries}>
                    {sermon.series || sermon.serviceType || 'Message'}
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary">
                    {formatDate(sermon.date)}
                  </ThemedText>
                </View>

                <ThemedText type="smallBold" style={styles.sermonTitle}>
                  {sermon.title}
                </ThemedText>
                <ThemedText type="small" themeColor="brandSoft" style={styles.sermonSpeaker}>
                  {sermon.speaker}
                </ThemedText>

                <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.sermonDesc}>
                  {sermon.description}
                </ThemedText>

                <View style={styles.sermonFooter}>
                  <View style={styles.footerStats}>
                    <ThemedText type="code" themeColor="textSecondary">❤️ {sermon.likes?.length || 0} likes</ThemedText>
                    {sermon.duration && (
                      <ThemedText type="code" themeColor="textSecondary">⏱ {sermon.duration} min</ThemedText>
                    )}
                  </View>
                  <View style={styles.formatBadge}>
                    <ThemedText type="code" style={styles.formatBadgeText}>{formatLabel}</ThemedText>
                  </View>
                </View>
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
  sermonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    marginBottom: Spacing.three,
  },
  sermonMetaLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  sermonSeries: {
    color: '#d6a650',
    textTransform: 'uppercase',
  },
  sermonTitle: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 2,
  },
  sermonSpeaker: {
    fontSize: 14,
    marginBottom: Spacing.two,
    fontWeight: 'bold',
  },
  sermonDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  sermonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: Spacing.two,
  },
  footerStats: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  formatBadge: {
    backgroundColor: 'rgba(155, 216, 170, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(155, 216, 170, 0.22)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 99,
  },
  formatBadgeText: {
    color: '#9bd8aa',
    fontSize: 10,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  detailHero: {
    width: '100%',
    height: Dimensions.get('window').height * 0.35,
    justifyContent: 'flex-end',
  },
  detailHeroImage: {
    opacity: 0.3,
  },
  detailHeroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 22, 28, 0.6)',
    justifyContent: 'flex-end',
    padding: Spacing.four,
  },
  detailHeroContent: {
    gap: Spacing.one,
  },
  categoryBadge: {
    backgroundColor: 'rgba(214, 166, 80, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(214, 166, 80, 0.3)',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    color: '#d6a650',
    fontSize: 10,
  },
  detailHeroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  detailSpeaker: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailBody: {
    padding: Spacing.four,
  },
  metaBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  metaRowLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  sectionHeading: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.four,
  },
  versesBox: {
    backgroundColor: 'rgba(214, 166, 80, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(214, 166, 80, 0.12)',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginBottom: Spacing.four,
  },
  verseText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#ffffff',
    marginBottom: Spacing.one,
    fontStyle: 'italic',
  },
  mediaBlock: {
    marginBottom: Spacing.four,
  },
  mediaButton: {
    backgroundColor: '#2f7d46',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaButtonText: {
    color: '#ffffff',
    fontSize: 15,
  },
  likeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  likeButtonDisabled: {
    opacity: 0.6,
  },
  likeButtonText: {
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
