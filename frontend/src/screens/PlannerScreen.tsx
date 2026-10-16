import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '../components/icons/Ionicons';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { planApi, recipeApi } from '../services/api';
import { suggestionApi } from '../services/api/suggestions';
import { Plan } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { PlannerStackParamList } from '../navigation/BottomTabNavigator';
import { dateToString, addDays, getNextMonday, parseDate, getTodayString, formatDateString, getMondayOfWeek } from '../utils/dateUtils';
import PlannerTutorial from '../components/PlannerTutorial';
import { hasPlannerTutorialCompleted } from '../utils/tutorialStorage';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive, maxContentWidth } from '../hooks/useResponsive';

type PlannerScreenNavigationProp = NativeStackNavigationProp<PlannerStackParamList, 'PlannerHome'>;
type PlannerScreenRouteProp = RouteProp<PlannerStackParamList, 'PlannerHome'>;

export default function PlannerScreen() {
  const navigation = useNavigation<PlannerScreenNavigationProp>();
  const route = useRoute<PlannerScreenRouteProp>();
  const { user } = useAuth();
  const { width, isDesktop, isTablet } = useResponsive();

  // Calculate responsive content width
  const contentMaxWidth = maxContentWidth.default;
  const shouldConstrainWidth = width > contentMaxWidth + 96;

  // Calculate initial week offset based on route params
  const getInitialWeekOffset = (): number => {
    // Show the week containing today by default
    const todayStr = getTodayString();
    const currentWeekMonday = getMondayOfWeek();
    const nextMonday = getNextMonday();

    // Calculate weeks difference
    const currentDate = parseDate(currentWeekMonday);
    const nextDate = parseDate(nextMonday);
    const daysDiff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksDiff = Math.floor(daysDiff / 7);

    return weeksDiff;
  };

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(getInitialWeekOffset());
  const [promptShown, setPromptShown] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [recipeCount, setRecipeCount] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  const isAdmin = user?.role === 'admin';

  // Reset week offset when route params change
  useEffect(() => {
    const newOffset = getInitialWeekOffset();
    if (newOffset !== weekOffset) {
      setWeekOffset(newOffset);
    }
  }, [route.params?.showCurrentWeek]);

  // Check if tutorial should be shown on first visit
  useEffect(() => {
    const checkTutorial = async () => {
      const completed = await hasPlannerTutorialCompleted();
      if (!completed) {
        setShowTutorial(true);
      }
    };
    checkTutorial();
  }, []);

  // Set up header with help button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ padding: spacing.sm, marginRight: spacing.xs }}
          onPress={() => setShowTutorial(true)}
          activeOpacity={0.6}
        >
          <Ionicons name="help-circle-outline" size={24} color={colors.textLight} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadWeekPlans();
      loadRecipeCount();
      setPromptShown(false); // Reset prompt when screen comes into focus
    }, [weekOffset]) // Reload when weekOffset changes OR when screen comes into focus
  );

  const loadRecipeCount = async () => {
    try {
      const recipes = await recipeApi.getAll();
      setRecipeCount(recipes.length);
    } catch (error) {
      console.error('Error loading recipe count:', error);
    }
  };

  // Removed prompt dialog for empty week - user can use "Plan This Week" button instead

  const getWeekDates = (offset: number = 0): { start: Date; end: Date; startStr: string } => {
    // Get next Monday using timezone-safe utility
    const mondayStr = getNextMonday();

    // Add weeks based on offset (can be positive for future weeks or negative for past weeks)
    const startStr = addDays(mondayStr, offset * 7);
    const endStr = addDays(startStr, 6); // Mon + 6 days = Sun

    // Convert strings back to Date objects for display
    const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);

    const [endYear, endMonth, endDay] = endStr.split('-').map(Number);
    const end = new Date(endYear, endMonth - 1, endDay);

    return { start, end, startStr };
  };

  const loadWeekPlans = async () => {
    try {
      setLoading(true);
      const { startStr } = getWeekDates(weekOffset);
      const data = await planApi.getWeekPlans(startStr, 7); // Mon - Sun
      setPlans(data);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanWeek = () => {
    if (recipeCount === 0) {
      // Don't show modal if no recipes, user will see the disabled state
      return;
    }
    setShowPlanModal(true);
  };

  const handleGetSuggestions = () => {
    const { startStr } = getWeekDates(weekOffset);
    setShowPlanModal(false);
    navigation.navigate('Constraints', { startDate: startStr, weekOffset });
  };

  const handlePickManually = async () => {
    setShowPlanModal(false);
    try {
      // Create empty plans for each day of the week
      const { startStr } = getWeekDates(weekOffset);
      const emptyPlans = [];

      for (let i = 0; i < 7; i++) {
        // Use timezone-safe date utilities
        const dateStr = addDays(startStr, i);

        // Create an empty plan for this date
        const plan = await planApi.updateByDate(dateStr, {
          recipeId: undefined,
          label: '',
          isConfirmed: false,
        });
        emptyPlans.push(plan);
      }

      setPlans(emptyPlans);
    } catch (error) {
      console.error('Error creating empty plans:', error);
    }
  };

  const formatDate = (dateStr: string): string => {
    return formatDateString(dateStr, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMinutes = (m: number): string =>
    m >= 60 ? `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`;

  const getDayName = (dateStr: string): string => {
    return formatDateString(dateStr, { weekday: 'long' });
  };

  const isToday = (dateStr: string): boolean => {
    const today = getTodayString();
    return dateStr === today;
  };

  const isPast = (dateStr: string): boolean => {
    const today = getTodayString();
    return dateStr < today;
  };

  const handleSuggestMeal = async (date: string) => {
    if (recipeCount === 0) return;

    try {
      // Get all recipe IDs already planned for this week to avoid duplicates
      const plannedRecipeIds = plans
        .filter(p => p.recipeId && p.date !== date)
        .map(p => typeof p.recipeId === 'object' ? p.recipeId._id : p.recipeId)
        .filter((id): id is string => id !== undefined);

      // Get a random suggestion excluding already-planned recipes
      const recipe = await suggestionApi.getAlternative(
        date,
        plannedRecipeIds,
        {
          avoidRepeats: false,
          vegetarianOnly: false,
        }
      );

      // Update the plan with the suggested recipe
      const updatedPlan = await planApi.updateByDate(date, {
        recipeId: recipe._id,
        isConfirmed: false,
      });

      // Update local state to show the new meal
      setPlans((prev) =>
        prev.map((p) => (p.date === date ? updatedPlan : p))
      );
    } catch (error) {
      console.error('Error suggesting meal:', error);
    }
  };

  const handlePickMeal = (date: string) => {
    if (recipeCount === 0) return;

    // Navigate to recipe picker screen
    const dateObj = parseDate(date);
    navigation.navigate('RecipePicker', {
      date,
      currentSuggestions: [{
        date,
        dayOfWeek: dateObj.getDay(),
        dayName: getDayName(date),
        isSkipped: false,
      }],
    });
  };

  // Suggest/Pick for upcoming days; past days get "Log" (pick what you
  // actually ate) so a week can be filled in after the fact.
  const renderDayActions = (date: string, past: boolean, planned: boolean) => {
    const disabled = recipeCount === 0;
    // A past day that already has a meal only needs a quiet "Change".
    if (past && planned) {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
            onPress={() => handlePickMeal(date)}
            disabled={disabled}
          >
            <Text style={[styles.actionButtonText, disabled && styles.actionButtonTextDisabled]}>Change</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.actionButtons}>
        {!past && (
          <TouchableOpacity
            style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
            onPress={() => handleSuggestMeal(date)}
            disabled={disabled}
          >
            <Text style={[styles.actionButtonText, disabled && styles.actionButtonTextDisabled]}>Suggest</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.pickButton, disabled && styles.pickButtonDisabled]}
          onPress={() => handlePickMeal(date)}
          disabled={disabled}
        >
          <Text style={[styles.pickButtonText, disabled && styles.pickButtonTextDisabled]}>{past ? 'Log' : 'Pick'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Landing-page day row: weekday + date numeral on the left, the meal on the
  // right. Label days (Leftovers, Eating Out) are dashed and set in italic;
  // today carries a terracotta outline and inset bar.
  const renderDayCard = (date: string, plan: Plan | null, showActions: boolean) => {
    const today = isToday(date);
    const past = isPast(date);
    const label = plan?.label;
    const recipe = plan?.recipeId;
    const minutes = recipe ? (recipe.prepTime || 0) + (recipe.cookTime || 0) : 0;

    return (
      <View
        key={date}
        testID={`day-${date}`}
        style={[
          styles.planCard,
          !!label && styles.planCardLabel,
          today && styles.planCardToday,
          past && styles.planCardPast,
        ]}
      >
        <View style={styles.dateStack}>
          <Text style={[styles.dateDow, today && styles.dateDowToday]}>
            {formatDateString(date, { weekday: 'short' })}
          </Text>
          <Text style={[styles.dateNum, today && styles.dateNumToday]}>
            {formatDateString(date, { day: 'numeric' })}
          </Text>
          {today && <Text style={styles.todayText}>Today</Text>}
        </View>

        <View style={styles.planBody}>
          <View style={styles.planMain}>
            {recipe ? (
              <>
                <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
                <View style={styles.recipeMeta}>
                  {minutes > 0 && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.metaText}>{formatMinutes(minutes)}</Text>
                    </View>
                  )}
                  {recipe.isVegetarian && (
                    <View style={[styles.tag, styles.tagVeg]}>
                      <Ionicons name="leaf" size={11} color={colors.secondary} />
                      <Text style={styles.tagText}>Vegetarian</Text>
                    </View>
                  )}
                </View>
              </>
            ) : label ? (
              <Text style={styles.labelText}>{label === 'TBD' ? 'To be decided' : label}</Text>
            ) : (
              <Text style={styles.emptyText}>Nothing planned yet</Text>
            )}
          </View>
          {past && (recipe || label) ? (
            <Ionicons name="checkmark-circle" size={18} color={colors.secondary} />
          ) : null}
          {showActions && renderDayActions(date, past, !!(recipe || label))}
        </View>
      </View>
    );
  };

  const renderPlan = ({ item }: { item: Plan; index: number }) =>
    renderDayCard(item.date, item, isAdmin);

  const renderEmptyWeek = () => {
    const { startStr } = getWeekDates(weekOffset);
    const days = [];
    // Show Mon - Sun (7 days)
    for (let i = 0; i < 7; i++) {
      days.push(renderDayCard(addDays(startStr, i), null, true));
    }
    return days;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { start, end } = getWeekDates(weekOffset);
  const weekLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const isNextWeek = weekOffset === 0;

  // Check if today falls within the displayed week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isThisWeek = today >= start && today <= end;

  // Check if all days in the week have plans (recipe or label)
  const allDaysPlanned = plans.length === 7 && plans.every(plan => plan.recipeId || plan.label);

  // Generate dynamic button text based on week offset
  const getPlanButtonText = (): string => {
    if (isThisWeek) {
      return 'Plan This Week';
    } else if (weekOffset === 0) {
      return 'Plan Next Week';
    } else if (weekOffset > 0) {
      return `Plan ${weekOffset + 1} Weeks From Now`;
    } else if (weekOffset === -1) {
      return 'Plan Last Week';
    } else {
      return `Plan ${Math.abs(weekOffset)} Weeks Ago`;
    }
  };

  return (
    <View style={[styles.outerContainer, shouldConstrainWidth && styles.desktopOuter]}>
      <View style={[styles.container, shouldConstrainWidth && styles.desktopContent, shouldConstrainWidth && { maxWidth: contentMaxWidth }]}>
      {/* Week Header with Navigation */}
      <View style={styles.weekHeaderContainer}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setWeekOffset(weekOffset - 1)}
          accessibilityRole="button"
          accessibilityLabel="Previous week"
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.weekLabelContainer}>
          <Text style={styles.weekLabel} numberOfLines={1}>{weekLabel}</Text>
        </View>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setWeekOffset(weekOffset + 1)}
          accessibilityRole="button"
          accessibilityLabel="Next week"
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Plan Week Button */}
      {!allDaysPlanned && isAdmin && (
        <View style={styles.headerActions}>
          {recipeCount === 0 ? (
            <View style={styles.noRecipesContainer}>
              <View style={styles.noRecipesCard}>
                <Ionicons name="restaurant-outline" size={32} color={colors.textMuted} />
                <Text style={styles.noRecipesTitle}>No Recipes Yet</Text>
                <Text style={styles.noRecipesText}>Add some recipes before planning your week</Text>
                <TouchableOpacity
                  style={styles.addRecipeButton}
                  onPress={() => navigation.navigate('RecipesTab' as any, {
                    screen: 'RecipeEntry',
                    params: { mode: 'create' },
                  })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={20} color={colors.white} />
                  <Text style={styles.addRecipeButtonText}>Add Your First Recipe</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.planButton}
              onPress={handlePlanWeek}
              activeOpacity={0.8}
            >
              <Text style={styles.planButtonText}>{getPlanButtonText()}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Week Plans */}
      {plans.length === 0 ? (
        <ScrollView style={styles.emptyContainer} contentContainerStyle={styles.emptyContent}>
          <View style={styles.emptyHeader}>
            <View style={styles.emptyCalendarIcon}>
              <Ionicons name="calendar-outline" size={100} color={colors.primary} />
            </View>
            <Text style={styles.emptyMessage}>{isNextWeek ? 'Your week is wide open!' : 'No plans yet'}</Text>
            <Text style={styles.emptySubtext}>
              {isNextWeek
                ? 'Ready to plan some delicious dinners? Tap the button above to get personalized meal suggestions.'
                : 'No meals planned for this week yet.'}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={plans}
          renderItem={renderPlan}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Plan Modal */}
      <Modal
        visible={showPlanModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPlanModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Plan This Week</Text>
            <Text style={styles.modalMessage}>How would you like to plan?</Text>

            {isAdmin && (
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleGetSuggestions}
              >
                <Text style={styles.modalButtonText}>Get Suggestions</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryModalButton]}
              onPress={handlePickManually}
            >
              <Text style={[styles.modalButtonText, styles.secondaryModalButtonText]}>Pick Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Planner Tutorial */}
      <PlannerTutorial
        visible={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  weekHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 60,
  },
  navButton: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    color: colors.textMuted,
    opacity: 0.5,
  },
  weekLabelContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  calendarIcon: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDate: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: typography.weights.bold as any,
    color: colors.primary,
    top: 12,
  },
  weekLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    textAlign: 'center',
  },
  nextWeekBadge: {
    fontSize: typography.sizes.tiny,
    color: colors.white,
    fontWeight: typography.weights.semibold as any,
    marginTop: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  futureWeekBadge: {
    fontSize: typography.sizes.tiny,
    color: colors.white,
    fontWeight: typography.weights.semibold as any,
    marginTop: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  pastWeekBadge: {
    fontSize: typography.sizes.tiny,
    color: colors.textLight,
    fontWeight: typography.weights.semibold as any,
    marginTop: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.divider,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  headerActions: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  planButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  planButtonText: {
    color: colors.textOnPrimary,
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold as any,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  planCardLabel: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  planCardToday: {
    borderColor: colors.primary,
    borderLeftWidth: 4,
    paddingLeft: spacing.md - 3,
  },
  planCardPast: {
    opacity: 0.72,
  },
  dateStack: {
    width: 44,
    alignItems: 'center',
  },
  dateDow: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: typography.weights.bold as any,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  dateDowToday: {
    color: colors.primary,
  },
  dateNum: {
    fontFamily: typography.families.display,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
  },
  dateNumToday: {
    color: colors.primary,
  },
  todayText: {
    fontFamily: typography.families.display,
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.primary,
  },
  planBody: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  planMain: {
    flex: 1,
    minWidth: 120,
  },
  recipeTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  tagVeg: {
    backgroundColor: colors.tagSimple,
  },
  tagText: {
    fontSize: 11,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    height: 32,
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  actionButtonText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
  },
  pickButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickButtonText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold as any,
    color: colors.textOnPrimary,
  },
  labelText: {
    fontFamily: typography.families.display,
    fontStyle: 'italic',
    fontSize: 17,
    color: colors.textLight,
  },
  emptyText: {
    fontStyle: 'italic',
    fontSize: typography.sizes.small,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    paddingBottom: spacing.xl,
  },
  emptyHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyCalendarIcon: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyCalendarDate: {
    position: 'absolute',
    fontSize: 32,
    fontWeight: typography.weights.bold as any,
    color: colors.primary,
    top: 58,
  },
  emptyMessage: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyDays: {
    paddingHorizontal: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '80%',
    maxWidth: 400,
    ...shadows.card,
  },
  modalCloseButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
    paddingRight: spacing.xl,
  },
  modalMessage: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.textOnPrimary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
  },
  secondaryModalButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryModalButtonText: {
    color: colors.primary,
  },
  noRecipesContainer: {
    width: '100%',
  },
  noRecipesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  noRecipesTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  noRecipesText: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  addRecipeButtonText: {
    color: colors.white,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
  },
  actionButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  actionButtonTextDisabled: {
    color: colors.textMuted,
  },
  pickButtonDisabled: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    opacity: 0.5,
  },
  pickButtonTextDisabled: {
    color: colors.textMuted,
  },
  // Responsive desktop/tablet styles
  outerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  desktopOuter: {
    backgroundColor: colors.divider,
    alignItems: 'center',
  },
  desktopContent: {
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
});
