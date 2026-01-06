import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, CommonActions } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Plan } from '../../types';
import { PlannerStackParamList } from '../../navigation/BottomTabNavigator';
import { formatDateString } from '../../utils/dateUtils';

// Conditionally import confetti if available
let ConfettiCannon: any = null;
try {
  ConfettiCannon = require('react-native-confetti-cannon').default;
} catch (e) {
  // Library not installed, will skip confetti
}

type SuccessScreenNavigationProp = NativeStackNavigationProp<
  PlannerStackParamList,
  'Success'
>;

type SuccessScreenRouteProp = RouteProp<PlannerStackParamList, 'Success'>;

interface Props {
  navigation: SuccessScreenNavigationProp;
  route: SuccessScreenRouteProp;
}

export default function SuccessScreen({ navigation, route }: Props) {
  const { plans } = route.params;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    // Shoot confetti on mount
    if (confettiRef.current) {
      confettiRef.current.start();
    }
  }, []);

  const formatDate = (dateStr: string): string => {
    return formatDateString(dateStr, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    try {
      const weekText = plans
        .map((plan) => {
          const dayStr = formatDate(plan.date);
          const mealStr = plan.recipeId
            ? plan.recipeId.title
            : plan.label || 'No meal planned';
          return `${dayStr}: ${mealStr}`;
        })
        .join('\n');

      const message = `This Week's Dinners 🍽️\n\n${weekText}\n\nPlanned with Meal Mate`;

      await Share.share({
        message,
        title: "This Week's Dinners",
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewCalendar = () => {
    // Reset the stack to PlannerHome
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'PlannerHome' }],
      })
    );
  };

  const handleDone = () => {
    // Reset the stack to PlannerHome
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'PlannerHome' }],
      })
    );
  };

  const mealCount = plans.filter((p) => p.recipeId).length;
  const skipCount = plans.filter((p) => p.label && !p.recipeId).length;

  return (
    <View style={styles.container}>
      {/* Confetti */}
      {ConfettiCannon && (
        <ConfettiCannon
          ref={confettiRef}
          count={100}
          origin={{ x: -10, y: 0 }}
          autoStart={true}
          fadeOut={true}
          colors={[colors.primary, colors.secondary, colors.success, '#FFD700']}
        />
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Success Message */}
        <View style={styles.successContainer}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.successTitle}>All set for the week!</Text>
          <Text style={styles.successSubtitle}>
            {mealCount} meal{mealCount !== 1 ? 's' : ''} planned
            {skipCount > 0 ? `, ${skipCount} day${skipCount !== 1 ? 's' : ''} eating out` : ''}
          </Text>
        </View>

        {/* Progress Indicator (Complete) */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotComplete]} />
          <View style={[styles.progressLine, styles.progressLineComplete]} />
          <View style={[styles.progressDot, styles.progressDotComplete]} />
          <View style={[styles.progressLine, styles.progressLineComplete]} />
          <View style={[styles.progressDot, styles.progressDotComplete]} />
          <Text style={styles.progressText}>Complete!</Text>
        </View>

        {/* Week Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Your Week</Text>
          {plans.map((plan) => (
            <View key={plan._id} style={styles.summaryRow}>
              <Text style={styles.summaryDate}>{formatDate(plan.date)}</Text>
              <Text
                style={[
                  styles.summaryMeal,
                  !plan.recipeId && styles.summaryMealLight,
                ]}
                numberOfLines={1}
              >
                {plan.recipeId
                  ? plan.recipeId.title
                  : plan.label || 'No meal planned'}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share This Week</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.viewButton} onPress={handleViewCalendar}>
          <Text style={styles.viewButtonText}>View Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  progressDotComplete: {
    backgroundColor: colors.success,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
    maxWidth: 40,
  },
  progressLineComplete: {
    backgroundColor: colors.success,
  },
  progressText: {
    marginLeft: spacing.md,
    fontSize: typography.sizes.small,
    color: colors.success,
    fontWeight: typography.weights.medium as any,
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  summaryTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryDate: {
    width: 100,
    fontSize: typography.sizes.small,
    color: colors.textLight,
    fontWeight: typography.weights.medium as any,
  },
  summaryMeal: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  summaryMealLight: {
    color: colors.textLight,
    fontStyle: 'italic',
  },
  bottomActions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  shareButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: typography.sizes.body,
    color: colors.secondary,
    fontWeight: typography.weights.medium as any,
  },
  viewButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: typography.sizes.body,
    color: colors.primary,
    fontWeight: typography.weights.medium as any,
  },
  doneButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: typography.sizes.body,
    color: colors.textOnPrimary,
    fontWeight: typography.weights.bold as any,
  },
});
