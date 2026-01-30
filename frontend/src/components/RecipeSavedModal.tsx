import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Recipe } from '../types';

// Try to import confetti cannon (may not be available)
let ConfettiCannon: any = null;
try {
  ConfettiCannon = require('react-native-confetti-cannon').default;
} catch (e) {
  // Confetti not available
}

interface Props {
  visible: boolean;
  recipe: Recipe | null;
  onViewRecipe: () => void;
  onAddAnother: () => void;
  onClose: () => void;
  simple?: boolean; // For edits - no confetti, simpler messaging
  notification?: boolean; // For ephemeral notifications - auto-dismiss, no interaction
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Encouraging messages to rotate through
const CELEBRATION_MESSAGES = [
  "Another delicious option for dinner night!",
  "Your recipe collection is growing!",
  "Can't wait to try this one!",
  "Sunday planning just got easier!",
  "One step closer to a tasty week!",
  "Your family is going to love this!",
  "Dinner inspiration: unlocked!",
  "Added to your culinary adventures!",
];

// Fun food emojis to randomly display
const FOOD_EMOJIS = ['🍝', '🍜', '🥘', '🍲', '🥗', '🌮', '🍕', '🥙', '🍛', '🥧', '🍰', '🧁'];

export default function RecipeSavedModal({
  visible,
  recipe,
  onViewRecipe,
  onAddAnother,
  onClose,
  simple = false,
  notification = false,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const confettiRef = useRef<any>(null);

  // Pick a random celebration message and emoji
  const celebrationMessage = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
  const randomEmoji = FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      // Start entrance animations
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Trigger confetti after a short delay (only for non-simple, non-notification mode)
      if (!simple && !notification) {
        setTimeout(() => {
          confettiRef.current?.start();
        }, 200);
      }

      // Auto-dismiss notification after 3 seconds
      if (notification) {
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    }
  }, [visible, notification, onClose]);

  if (!recipe) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={notification ? undefined : onClose}
    >
      <View style={[styles.overlay, notification && styles.notificationOverlay]}>
        {/* Confetti - only for non-simple mode */}
        {!simple && ConfettiCannon && (
          <ConfettiCannon
            ref={confettiRef}
            count={80}
            origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
            fadeOut
            autoStart={false}
            fallSpeed={2500}
            colors={[colors.primary, colors.secondary, colors.success, '#FFD700', '#FF6B6B']}
          />
        )}

        <Animated.View
          style={[
            styles.modalContainer,
            notification && styles.notificationContainer,
            {
              opacity: fadeAnim,
              transform: notification ? [] : [{ scale: scaleAnim }],
            },
          ]}
        >
          {notification ? (
            // Notification layout - simple and compact
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="checkmark" size={20} color={colors.success} />
                </View>
                <Text style={styles.notificationTitle}>Recipe Updated!</Text>
              </View>
              <Text style={styles.notificationMessage} numberOfLines={1}>
                {recipe.title}
              </Text>
            </View>
          ) : (
            // Full modal layout
            <>
              {/* Success Icon */}
              <View style={styles.successIconContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={40} color={colors.white} />
                </View>
                {!simple && (
                  <Text style={styles.emojiFloat}>{randomEmoji}</Text>
                )}
              </View>

              {/* Main Content */}
              <Animated.View
                style={[
                  styles.content,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <Text style={styles.title}>
                  {simple ? 'Recipe Updated!' : 'Recipe Saved!'}
                </Text>
                {!simple && (
                  <Text style={styles.celebrationText}>{celebrationMessage}</Text>
                )}

                {/* Recipe Preview Card */}
                <View style={styles.recipeCard}>
                  {recipe.imageUrl ? (
                    <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
                  ) : (
                    <View style={styles.recipeImagePlaceholder}>
                      <Text style={styles.placeholderEmoji}>{randomEmoji}</Text>
                    </View>
                  )}
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName} numberOfLines={2}>
                      {recipe.title}
                    </Text>
                    <View style={styles.recipeMeta}>
                      {recipe.isVegetarian && (
                        <View style={[styles.badge, styles.vegBadge]}>
                          <Ionicons name="leaf" size={12} color={colors.secondary} />
                          <Text style={[styles.badgeText, { color: colors.secondary }]}>Veggie</Text>
                        </View>
                      )}
                    </View>
                    {recipe.cookTime && recipe.cookTime > 0 && (
                      <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.timeText}>{recipe.cookTime} min cook time</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onViewRecipe}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye-outline" size={20} color={colors.textOnPrimary} />
                    <Text style={styles.primaryButtonText}>View Recipe</Text>
                  </TouchableOpacity>

                  {!simple && (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={onAddAnother}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                      <Text style={styles.secondaryButtonText}>Add Another</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Tip */}
                <View style={styles.tipContainer}>
                  <Ionicons name="bulb-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.tipText}>
                    {simple
                      ? 'Your recipe changes have been saved!'
                      : 'This recipe is now ready to use in your weekly meal planning!'
                    }
                  </Text>
                </View>
              </Animated.View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg * 2,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...shadows.floating,
  },
  successIconContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    position: 'relative',
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
  },
  emojiFloat: {
    position: 'absolute',
    top: spacing.md,
    right: '25%',
    fontSize: 32,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  celebrationText: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  recipeImage: {
    width: 100,
    height: 100,
  },
  recipeImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  recipeInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recipeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  vegBadge: {
    backgroundColor: colors.secondaryLight,
  },
  badgeText: {
    fontSize: typography.sizes.tiny,
    color: colors.primary,
    fontWeight: typography.weights.medium as any,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    fontSize: typography.sizes.small,
    color: colors.textMuted,
  },
  buttonContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.button,
  },
  primaryButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold as any,
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.primary,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tipText: {
    fontSize: typography.sizes.small,
    color: colors.textMuted,
    textAlign: 'center',
    flex: 1,
  },
  // Notification styles
  notificationOverlay: {
    justifyContent: 'flex-start',
    paddingTop: spacing.xl * 2,
    backgroundColor: 'transparent',
  },
  notificationContainer: {
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    ...shadows.floating,
  },
  notificationContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  notificationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.success,
  },
  notificationMessage: {
    fontSize: typography.sizes.body,
    color: colors.text,
    textAlign: 'center',
  },
});
