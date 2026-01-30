import React, { useState, useCallback, useMemo } from 'react';
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
import { getTodayString, addDays, parseDate, dateToString } from '../../utils/dateUtils';
import { useResponsive, maxContentWidth } from '../../hooks/useResponsive';

type Props = {
  navigation: any;
};

/** Build an array of date strings for the next `count` days starting from `from`. */
function buildDateRange(from: string, count: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(addDays(from, i));
  }
  return dates;
}

/** Format YYYY-MM-DD for a short label like "Mon 2/3" */
function shortLabel(dateStr: string): { weekday: string; monthDay: string } {
  const d = parseDate(dateStr);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = `${d.getMonth() + 1}/${d.getDate()}`;
  return { weekday, monthDay };
}

export default function GroceryListPickerScreen({ navigation }: Props) {
  const today = getTodayString();
  // Show 21 days of selectable dates (3 weeks ahead)
  const selectableDates = useMemo(() => buildDateRange(today, 21), [today]);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 6));
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { width } = useResponsive();

  const contentMaxWidth = maxContentWidth.default;
  const contentWidth = width > contentMaxWidth + 96 ? contentMaxWidth : '100%';

  // How many days in range
  const dayCount = useMemo(() => {
    const s = parseDate(startDate);
    const e = parseDate(endDate);
    return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  }, [startDate, endDate]);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const result = await planApi.getWeekPlans(startDate, dayCount);
      setPlans(result.filter((p) => p.recipeId));
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, dayCount]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [loadPlans])
  );

  const handleDateTap = (dateStr: string) => {
    if (picking === 'start') {
      setStartDate(dateStr);
      if (dateStr > endDate) setEndDate(dateStr);
      setPicking('end');
    } else if (picking === 'end') {
      if (dateStr < startDate) {
        setStartDate(dateStr);
        setEndDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
      setPicking(null);
    } else {
      // Not in picking mode — start picking from start
      setStartDate(dateStr);
      setPicking('end');
    }
  };

  const isInRange = (dateStr: string) => dateStr >= startDate && dateStr <= endDate;

  const handleGenerate = async () => {
    if (plans.length === 0) {
      Alert.alert('No Plans', 'There are no planned meals in this range. Plan some meals first!');
      return;
    }
    try {
      setGenerating(true);
      const list = await groceryListApi.create({ startDate, endDate });
      navigation.navigate('GroceryStoreMode', { listId: list._id });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate grocery list');
    } finally {
      setGenerating(false);
    }
  };

  const formatDisplay = (dateStr: string) => {
    const d = parseDate(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      <Text style={styles.subtitle}>Pick a date range to shop for.</Text>

      {/* Date range display */}
      <View style={styles.rangePicker}>
        <TouchableOpacity
          style={[styles.dateButton, picking === 'start' && styles.dateButtonActive]}
          onPress={() => setPicking(picking === 'start' ? null : 'start')}
        >
          <Text style={styles.dateButtonLabel}>From</Text>
          <Text style={styles.dateButtonValue}>{formatDisplay(startDate)}</Text>
        </TouchableOpacity>
        <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
        <TouchableOpacity
          style={[styles.dateButton, picking === 'end' && styles.dateButtonActive]}
          onPress={() => setPicking(picking === 'end' ? null : 'end')}
        >
          <Text style={styles.dateButtonLabel}>To</Text>
          <Text style={styles.dateButtonValue}>{formatDisplay(endDate)}</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar strip */}
      {picking !== null && (
        <View style={styles.calendarStrip}>
          <Text style={styles.calendarHint}>
            {picking === 'start' ? 'Tap a start date' : 'Tap an end date'}
          </Text>
          <View style={styles.calendarGrid}>
            {selectableDates.map((dateStr) => {
              const { weekday, monthDay } = shortLabel(dateStr);
              const inRange = isInRange(dateStr);
              const isEdge = dateStr === startDate || dateStr === endDate;
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.calendarDay,
                    inRange && styles.calendarDayInRange,
                    isEdge && styles.calendarDayEdge,
                  ]}
                  onPress={() => handleDateTap(dateStr)}
                >
                  <Text
                    style={[
                      styles.calendarWeekday,
                      (inRange || isEdge) && styles.calendarTextHighlight,
                    ]}
                  >
                    {weekday}
                  </Text>
                  <Text
                    style={[
                      styles.calendarDate,
                      (inRange || isEdge) && styles.calendarTextHighlight,
                      isEdge && styles.calendarDateEdge,
                    ]}
                  >
                    {monthDay}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <Text style={styles.rangeInfo}>
        {dayCount} day{dayCount !== 1 ? 's' : ''} selected
      </Text>

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
                  {parseDate(plan.date).toLocaleDateString('en-US', {
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
  rangePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dateButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  dateButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  dateButtonLabel: {
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    marginBottom: 2,
  },
  dateButtonValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  calendarStrip: {
    marginBottom: spacing.md,
  },
  calendarHint: {
    fontSize: typography.sizes.small,
    color: colors.primary,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  calendarDay: {
    width: '13%',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  calendarDayInRange: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  calendarDayEdge: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  calendarWeekday: {
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
  },
  calendarDate: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  calendarTextHighlight: {
    color: colors.text,
  },
  calendarDateEdge: {
    color: colors.textOnPrimary,
    fontWeight: typography.weights.bold,
  },
  rangeInfo: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
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
