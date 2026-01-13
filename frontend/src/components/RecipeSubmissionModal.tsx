import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { submissionApi } from '../services/api';

interface RecipeSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}

export default function RecipeSubmissionModal({
  visible,
  onClose,
  onSubmit
}: RecipeSubmissionModalProps) {
  const [recipeUrl, setRecipeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!recipeUrl.trim()) {
      Alert.alert('Error', 'Please enter a recipe URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(recipeUrl.trim());
    } catch {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    try {
      setSubmitting(true);
      await submissionApi.submitRecipe({ recipeUrl: recipeUrl.trim() });
      Alert.alert(
        'Success',
        'Recipe submitted for approval! The household admin will review it.',
        [{ text: 'OK', onPress: handleClose }]
      );
      onSubmit?.();
    } catch (error: any) {
      console.error('Error submitting recipe:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit recipe');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRecipeUrl('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submit Recipe</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant-outline" size={48} color={colors.primary} />
          </View>

          <Text style={styles.title}>Share a Recipe</Text>
          <Text style={styles.subtitle}>
            Found a great recipe online? Submit the URL for your household admin to review and add to your shared collection.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Recipe URL</Text>
            <TextInput
              style={styles.input}
              value={recipeUrl}
              onChangeText={setRecipeUrl}
              placeholder="https://example.com/recipe"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!submitting}
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.secondary} />
            <Text style={styles.infoText}>
              The recipe will be automatically imported and added to your household's collection once approved.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton, (!recipeUrl.trim() || submitting) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!recipeUrl.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit for Approval</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  closeButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.body,
    color: colors.text,
    backgroundColor: colors.white,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.secondary + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
    color: colors.white,
  },
});