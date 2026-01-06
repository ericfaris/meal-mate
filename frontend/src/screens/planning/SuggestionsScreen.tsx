import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { suggestionApi, DaySuggestion } from '../../services/api/suggestions';
import { SuggestionConstraints } from '../../types';
import { PlannerStackParamList } from '../../navigation/BottomTabNavigator';
import { planApi } from '../../services/api/plans';
import { formatDateString } from '../../utils/dateUtils';

type SuggestionsScreenNavigationProp = NativeStackNavigationProp<
  PlannerStackParamList,
  'Suggestions'
>;

type SuggestionsScreenRouteProp = RouteProp<PlannerStackParamList, 'Suggestions'>;

interface Props {
  navigation: SuggestionsScreenNavigationProp;
  route: SuggestionsScreenRouteProp;
}

export default function SuggestionsScreen({ navigation, route }: Props) {
  const { constraints, suggestions: initialSuggestions } = route.params;
  const [suggestions, setSuggestions] = useState<DaySuggestion[]>(initialSuggestions);
  const [loadingDay, setLoadingDay] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  // Track all recipe IDs that have been shown (current + alternatives)
  const [excludedRecipeIds, setExcludedRecipeIds] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    initialSuggestions.forEach((s) => {
      if (s.recipeId) {
        initial[s.date] = [s.recipeId];
      }
    });
    return initial;
  });

  // Reload plans when screen comes into focus (after picking a recipe)
  useFocusEffect(
    useCallback(() => {
      const reloadPlans = async () => {
        try {
          // Get the start date from the first suggestion
          if (initialSuggestions.length > 0) {
            const startDate = initialSuggestions[0].date;
            console.log('Reloading plans for week starting:', startDate);
            const plans = await planApi.getWeekPlans(startDate, 7);
            console.log('Reloaded plans:', plans.length);

            // Update suggestions with the latest plan data
            setSuggestions((prev) =>
              prev.map((suggestion) => {
                const matchingPlan = plans.find((p) => p.date === suggestion.date);
                if (matchingPlan && matchingPlan.recipeId) {
                  console.log('Updated suggestion for', suggestion.date, 'with recipe:', matchingPlan.recipeId.title);
                  return {
                    ...suggestion,
                    recipeId: matchingPlan.recipeId._id,
                    recipe: matchingPlan.recipeId,
                  };
                }
                return suggestion;
              })
            );
          }
        } catch (error) {
          console.error('Error reloading plans:', error);
        }
      };

      reloadPlans();
    }, []) // Empty dependency array means it runs every time the screen comes into focus
  );

  const handleChangeRecipe = async (date: string) => {
    setLoadingDay(date);
    try {
      const currentExcluded = excludedRecipeIds[date] || [];
      const alternative = await suggestionApi.getAlternative(
        date,
        currentExcluded,
        {
          avoidRepeats: constraints.avoidRepeats,
          preferSimple: constraints.preferSimple,
          vegetarianOnly: constraints.vegetarianOnly,
        }
      );

      // Update suggestions with new recipe
      setSuggestions((prev) =>
        prev.map((s) =>
          s.date === date
            ? { ...s, recipeId: alternative._id, recipe: alternative }
            : s
        )
      );

      // Add to excluded list
      setExcludedRecipeIds((prev) => ({
        ...prev,
        [date]: [...(prev[date] || []), alternative._id],
      }));
    } catch (error) {
      console.error('Error getting alternative:', error);
    } finally {
      setLoadingDay(null);
    }
  };

  const handlePickRecipe = (date: string) => {
    // Navigate to recipe picker modal/screen
    navigation.navigate('RecipePicker', { date, currentSuggestions: suggestions });
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const response = await suggestionApi.approveSuggestions(suggestions);
      navigation.navigate('Success', { plans: response.plans });
    } catch (error) {
      console.error('Error approving suggestions:', error);
    } finally {
      setApproving(false);
    }
  };

  const renderDayCard = (suggestion: DaySuggestion) => {
    const isLoading = loadingDay === suggestion.date;

    if (suggestion.isSkipped) {
      return (
        <View key={suggestion.date} style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayName}>{suggestion.dayName}</Text>
            <Text style={styles.dayDate}>{formatDate(suggestion.date)}</Text>
          </View>
          <View style={styles.skippedContent}>
            <Text style={styles.skippedEmoji}>🍽️</Text>
            <Text style={styles.skippedText}>{suggestion.label || 'Eating Out'}</Text>
          </View>
        </View>
      );
    }

    return (
      <View key={suggestion.date} style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayName}>{suggestion.dayName}</Text>
          <Text style={styles.dayDate}>{formatDate(suggestion.date)}</Text>
        </View>

        {suggestion.recipe ? (
          <View style={styles.recipeContent}>
            <View style={styles.recipeInfo}>
              {suggestion.recipe.imageUrl && (
                <Image
                  source={{ uri: suggestion.recipe.imageUrl }}
                  style={styles.recipeImage}
                />
              )}
              <View style={styles.recipeDetails}>
                <Text style={styles.recipeTitle} numberOfLines={2}>
                  {suggestion.recipe.title}
                </Text>
                <View style={styles.recipeTags}>
                  {suggestion.recipe.isVegetarian && (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>🥬 Vegetarian</Text>
                    </View>
                  )}
                  {suggestion.recipe.complexity && (
                    <View style={[styles.tag, styles.complexityTag]}>
                      <Text style={styles.tagText}>
                        {suggestion.recipe.complexity === 'simple' ? '⚡' :
                         suggestion.recipe.complexity === 'medium' ? '⏱️' : '👨‍🍳'}{' '}
                        {suggestion.recipe.complexity}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => handleChangeRecipe(suggestion.date)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.changeButtonText}>Suggest</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickButton}
                onPress={() => handlePickRecipe(suggestion.date)}
                disabled={isLoading}
              >
                <Text style={styles.pickButtonText}>Pick</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noRecipeContent}>
            <Text style={styles.noRecipeText}>
              No recipe available - try adjusting your filters
            </Text>
          </View>
        )}
      </View>
    );
  };

  const formatDate = (dateStr: string): string => {
    return formatDateString(dateStr, { month: 'short', day: 'numeric' });
  };

  const mealCount = suggestions.filter((s) => !s.isSkipped && s.recipe).length;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Here's your week!</Text>
          <Text style={styles.subHeader}>
            {mealCount} meal{mealCount !== 1 ? 's' : ''} planned
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotComplete]} />
          <View style={[styles.progressLine, styles.progressLineComplete]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
          <Text style={styles.progressText}>Step 2 of 3</Text>
        </View>

        {/* Day Cards */}
        <View style={styles.cardsContainer}>
          {suggestions.map(renderDayCard)}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={approving}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.approveButton, approving && styles.approveButtonDisabled]}
          onPress={handleApprove}
          disabled={approving}
        >
          {approving ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.approveButtonText}>Approve & Finalize</Text>
          )}
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
  },
  headerContainer: {
    marginBottom: spacing.md,
  },
  header: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
  },
  subHeader: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
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
    color: colors.textLight,
  },
  cardsContainer: {
    gap: spacing.md,
  },
  dayCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.card,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dayName: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
  },
  dayDate: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
  },
  skippedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skippedEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  skippedText: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  recipeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    backgroundColor: colors.border,
  },
  recipeDetails: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  complexityTag: {
    backgroundColor: colors.primaryLight,
  },
  tagText: {
    fontSize: typography.sizes.small,
    color: colors.text,
    textTransform: 'capitalize',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  changeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  changeButtonText: {
    fontSize: typography.sizes.body,
    color: colors.primary,
    fontWeight: typography.weights.medium as any,
  },
  pickButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  pickButtonText: {
    fontSize: typography.sizes.body,
    color: colors.primary,
    fontWeight: typography.weights.medium as any,
  },
  noRecipeContent: {
    paddingVertical: spacing.sm,
  },
  noRecipeText: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    fontWeight: typography.weights.medium as any,
  },
  approveButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonDisabled: {
    opacity: 0.7,
  },
  approveButtonText: {
    fontSize: typography.sizes.body,
    color: colors.textOnPrimary,
    fontWeight: typography.weights.bold as any,
  },
});
