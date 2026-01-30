import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Plan } from '../../types';
import { planApi } from '../../services/api/plans';
import { groceryListApi } from '../../services/api/groceryLists';
import { getTodayString } from '../../utils/dateUtils';
import { useResponsive, maxContentWidth } from '../../hooks/useResponsive';

type Props = {
  navigation: any;
};

const DINNER_OPTIONS = [3, 5, 7, 10, 14];

export default function GroceryListPickerScreen({ navigation }: Props) {
  const [selectedCount, setSelectedCount] = useState(7);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { width } = useResponsive();

  const contentMaxWidth = maxContentWidth.default;
  const shouldConstrainWidth = width > contentMaxWidth + 96;
  const contentWidth = shouldConstrainWidth ? contentMaxWidth : '100%';

  const startDate = getTodayString();

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const result = await planApi.getWeekPlans(startDate, selectedCount);
      setPlans(result.filter((p) => p.recipeId));
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCount, startDate]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [loadPlans])
  );

  const handleGenerate = async () => {
    if (plans.length === 0) {
      Alert.alert('No Plans', 'There are no planned meals in this range. Plan some meals first!');
      return;
    }

    try {
      setGenerating(true);
      const list = await groceryListApi.create({
        startDate,
        daysCount: selectedCount,
      });
      navigation.navigate('GroceryStoreMode', { listId: list._id });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate grocery list');
    } finally {
      setGenerating(false);
    }
  };

  // Calculate end date for display
  const getEndDate = () => {
    const [y, m, d] = startDate.split('-').map(Number);
    const end = new Date(y, m - 1, d);
    end.setDate(end.getDate() + selectedCount - 1);
    return `${end.getMonth() + 1}/${end.getDate()}`;
  };

  const getStartDisplay = () => {
    const [y, m, d] = startDate.split('-').map(Number);
    return `${m}/${d}`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { maxWidth: contentMaxWidth, width: contentWidth, alignSelf: 'center' as const },
      ]}
    >
      <Text style={styles.title}>Generate Grocery List</Text>
      <Text style={styles.subtitle}>
        How many upcoming dinners do you want to shop for?
      </Text>

      <View style={styles.optionsRow}>
        {DINNER_OPTIONS.map((count) => (
          <TouchableOpacity
            key={count}
            style={[
              styles.optionChip,
              selectedCount === count && styles.optionChipSelected,
            ]}
            onPress={() => setSelectedCount(count)}
          >
            <Text
              style={[
                styles.optionText,
                selectedCount === count && styles.optionTextSelected,
              ]}
            >
              {count}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dateRange}>
        <Ionicons name="calendar-outline" size={16} color={colors.textLight} />
        <Text style={styles.dateRangeText}>
          {getStartDisplay()} — {getEndDate()}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <View style={styles.planSummary}>
            <Text style={styles.planSummaryTitle}>
              {plans.length} planned meal{plans.length !== 1 ? 's' : ''} found
            </Text>
            {plans.length === 0 && (
              <Text style={styles.warningText}>
                No meals planned in this range. Head to the Planner to add some!
              </Text>
            )}
            {plans.map((plan, i) => (
              <View key={i} style={styles.planRow}>
                <Text style={styles.planDate}>
                  {new Date(plan.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.planRecipe} numberOfLines={1}>
                  {(plan.recipeId as any)?.title || plan.label || '—'}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.generateButton, plans.length === 0 && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={generating || plans.length === 0}
          >
            {generating ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <>
                <Ionicons name="cart" size={20} color={colors.textOnPrimary} />
                <Text style={styles.generateButtonText}>Generate List</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.historyLink}
        onPress={() => navigation.navigate('GroceryHistory')}
      >
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <Text style={styles.historyLinkText}>View Past Lists</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    marginBottom: spacing.lg,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionChip: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  optionChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.textLight,
  },
  optionTextSelected: {
    color: colors.primary,
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dateRangeText: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
  },
  loader: {
    marginTop: spacing.xl,
  },
  planSummary: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  planSummaryTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  warningText: {
    fontSize: typography.sizes.small,
    color: colors.warning,
    fontStyle: 'italic',
  },
  planRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  planDate: {
    fontSize: typography.sizes.small,
    color: colors.textMuted,
    width: 100,
  },
  planRecipe: {
    flex: 1,
    fontSize: typography.sizes.small,
    color: colors.text,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.button,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textOnPrimary,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  historyLinkText: {
    fontSize: typography.sizes.body,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
});
