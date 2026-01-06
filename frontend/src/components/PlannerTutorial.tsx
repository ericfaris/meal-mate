import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { setPlannerTutorialCompleted } from '../utils/tutorialStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STEP_WIDTH = Math.min(SCREEN_WIDTH - spacing.md * 2, 400);

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface TutorialStep {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  tips: string[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: 'calendar-outline',
    iconColor: colors.primary,
    title: 'Welcome to Meal Planning',
    description: 'Plan your dinners for the week ahead with ease. Browse through weeks using the arrows and see all 7 days at a glance.',
    tips: [
      'Use the arrows to navigate between weeks',
      'Each card shows one day of your meal plan',
      'Today is highlighted with a special border',
    ],
  },
  {
    icon: 'options-outline',
    iconColor: colors.secondary,
    title: 'Two Ways to Plan',
    description: 'Choose how you want to plan your meals. Get AI-powered suggestions or pick recipes manually - the choice is yours!',
    tips: [
      '"Get Suggestions" uses AI to pick recipes for you',
      '"Pick Manually" lets you choose each meal yourself',
      'You can mix both approaches for flexibility',
    ],
  },
  {
    icon: 'sparkles-outline',
    iconColor: colors.warning,
    title: 'AI-Powered Suggestions',
    description: 'Let the app suggest meals based on your recipe collection. Customize which days you\'re cooking and avoid recent repeats.',
    tips: [
      'Select which days you want to cook',
      'Toggle "Avoid Repeats" to skip recently used recipes',
      'The app picks from YOUR recipe collection',
    ],
  },
  {
    icon: 'swap-horizontal-outline',
    iconColor: colors.primary,
    title: 'Review & Customize',
    description: 'Not happy with a suggestion? Easily swap it out! Use "Suggest" for a new idea or "Pick" to choose manually.',
    tips: [
      '"Suggest" gives you a different recipe option',
      '"Pick" opens your full recipe list to choose from',
      'Approve all when you\'re happy with the plan',
    ],
  },
  {
    icon: 'checkmark-circle-outline',
    iconColor: colors.success,
    title: 'Daily Management',
    description: 'As you cook through the week, confirm meals and track your progress. You can also mark days as "Eating Out" or add custom notes.',
    tips: [
      'Tap a meal card to see the full recipe',
      'Confirmed meals show a checkmark badge',
      'Swipe through weeks to plan ahead',
    ],
  },
];

export default function PlannerTutorial({ visible, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({ x: nextStep * STEP_WIDTH, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await setPlannerTutorialCompleted();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const step = Math.round(offsetX / STEP_WIDTH);
    if (step !== currentStep && step >= 0 && step < TUTORIAL_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const renderStep = (step: TutorialStep, index: number) => (
    <View key={index} style={styles.stepContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.stepScrollContent}
      >
        <View style={styles.stepContent}>
          {/* Icon Circle */}
          <View style={[styles.iconCircle, { backgroundColor: step.iconColor + '20' }]}>
            <Ionicons name={step.icon} size={36} color={step.iconColor} />
          </View>

          {/* Title */}
          <Text style={styles.stepTitle}>{step.title}</Text>

          {/* Description */}
          <Text style={styles.stepDescription}>{step.description}</Text>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            {step.tips.map((tip, tipIndex) => (
              <View key={tipIndex} style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleSkip}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.modalContainer}>
          {/* Header with Skip button */}
          <View style={styles.header}>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepIndicatorText}>
                {currentStep + 1} of {TUTORIAL_STEPS.length}
              </Text>
            </View>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Swipeable Content */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
            snapToInterval={STEP_WIDTH}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {TUTORIAL_STEPS.map((step, index) => renderStep(step, index))}
          </ScrollView>

          {/* Progress Dots */}
          <View style={styles.dotsContainer}>
            {TUTORIAL_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Next/Done Button */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === TUTORIAL_STEPS.length - 1 ? "Let's Go!" : 'Next'}
            </Text>
            {currentStep < TUTORIAL_STEPS.length - 1 && (
              <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl * 2,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    overflow: 'hidden',
    ...shadows.floating,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  stepIndicator: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  stepIndicatorText: {
    fontSize: typography.sizes.small,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  skipButton: {
    padding: spacing.sm,
  },
  skipText: {
    fontSize: typography.sizes.body,
    color: colors.textMuted,
  },
  stepContainer: {
    width: STEP_WIDTH,
    paddingHorizontal: spacing.md,
    maxHeight: 450,
  },
  stepScrollContent: {
    flexGrow: 1,
  },
  stepContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: typography.sizes.small * 1.5,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tipText: {
    flex: 1,
    fontSize: typography.sizes.small,
    color: colors.text,
    lineHeight: typography.sizes.small * 1.4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.button,
  },
  nextButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold as any,
    color: colors.textOnPrimary,
  },
});
