import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import api from '../services/api';

interface FeedbackScreenProps {
  onBack: () => void;
}

const feedbackTypes = [
  { value: 'general', label: 'General Feedback' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'website', label: 'Website/App' },
];

export default function FeedbackScreen({ onBack }: FeedbackScreenProps) {
  const [type, setType] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState('5');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async () => {
    setStatus(null);
    if (!subject || !message) {
      setStatus({ type: 'error', text: 'Please fill in Subject and Message.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/feedback', {
        type,
        subject,
        message,
        rating: Number(rating),
      });

      setStatus({ type: 'success', text: 'Thank you for your feedback!' });
      // Reset form
      setType('general');
      setSubject('');
      setMessage('');
      setRating('5');

      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', text: err.response?.data?.message || 'Failed to submit feedback.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ThemedText type="smallBold" style={styles.backButtonText}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.title}>Feedback</ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary">
            Share suggestions, reports, or questions with the team.
          </ThemedText>
        </View>

        {/* Message Banner */}
        {status && (
          <View style={[styles.statusCard, status.type === 'error' ? styles.errorCard : styles.successCard]}>
            <ThemedText style={styles.statusText}>{status.text}</ThemedText>
          </View>
        )}

        <View style={styles.formCard}>
          <ThemedText type="smallBold" style={styles.inputLabel}>Feedback Category</ThemedText>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={type}
              onValueChange={(itemValue) => setType(itemValue)}
              style={styles.picker}
              dropdownIconColor="#ffffff"
            >
              {feedbackTypes.map((t) => (
                <Picker.Item key={t.value} label={t.label} value={t.value} color="#ffffff" />
              ))}
            </Picker>
          </View>

          <ThemedText type="smallBold" style={styles.inputLabel}>Subject</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="What is this about?"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={subject}
            onChangeText={setSubject}
          />

          <ThemedText type="smallBold" style={styles.inputLabel}>Your Message</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Type your suggestion or comments here..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            multiline
            numberOfLines={5}
            value={message}
            onChangeText={setMessage}
          />

          <ThemedText type="smallBold" style={styles.inputLabel}>Rating (1-5 Stars)</ThemedText>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={rating}
              onValueChange={(itemValue) => setRating(itemValue)}
              style={styles.picker}
              dropdownIconColor="#ffffff"
            >
              <Picker.Item label="5 Stars (Excellent)" value="5" color="#ffffff" />
              <Picker.Item label="4 Stars (Good)" value="4" color="#ffffff" />
              <Picker.Item label="3 Stars (Average)" value="3" color="#ffffff" />
              <Picker.Item label="2 Stars (Fair)" value="2" color="#ffffff" />
              <Picker.Item label="1 Star (Poor)" value="1" color="#ffffff" />
            </Picker>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText type="smallBold" style={styles.submitButtonText}>Submit Feedback</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    marginHorizontal: Spacing.four,
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
  statusCard: {
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
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
