import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Recipe, Plan } from '../types';
import { recipeApi } from '../services/api/recipes';
import { planApi } from '../services/api/plans';
import { getTodayString, formatDateString } from '../utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  navigation: any;
};

export default function HomeScreen({ navigation }: Props) {
  const [todayPlan, setTodayPlan] = useState<Plan | null>(null);
  const [spotlightRecipe, setSpotlightRecipe] = useState<Recipe | null>(null);
  const [recipeCount, setRecipeCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTodayDateString = (): string => {
    return getTodayString();
  };

  const loadData = async () => {
    try {
      // Get today's plan
      const today = getTodayDateString();
      try {
        const todaysPlan = await planApi.getByDate(today);
        setTodayPlan(todaysPlan);
      } catch {
        // No plan for today
        setTodayPlan(null);
      }

      // Get all recipes for count and spotlight
      const recipes = await recipeApi.getAll();
      setRecipeCount(recipes.length);

      // Pick a random recipe for spotlight (different from today's plan if possible)
      if (recipes.length > 0) {
        const availableRecipes = todayPlan?.recipeId
          ? recipes.filter(r => r._id !== (todayPlan.recipeId as Recipe)?._id)
          : recipes;
        const recipesToChooseFrom = availableRecipes.length > 0 ? availableRecipes : recipes;
        const randomIndex = Math.floor(Math.random() * recipesToChooseFrom.length);
        setSpotlightRecipe(recipesToChooseFrom[randomIndex]);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  };

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string): string => {
    return formatDateString(dateString, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDayOfWeek = (): string => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  };

  const navigateToRecipe = (recipe: Recipe) => {
    navigation.navigate('RecipesTab', {
      screen: 'RecipeDetail',
      params: { recipe },
    });
  };

  const navigateToPlanner = () => {
    navigation.navigate('PlannerTab');
  };

  const navigateToRecipes = () => {
    navigation.navigate('RecipesTab');
  };

  const navigateToAddRecipe = () => {
    navigation.navigate('RecipesTab', {
      screen: 'RecipeEntry',
      params: { mode: 'create' },
    });
  };

  const navigateToPlanWeek = () => {
    navigation.navigate('PlannerTab', {
      screen: 'PlannerHome',
      params: { showCurrentWeek: true },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}!</Text>
        <Text style={styles.dateText}>{formatDate(getTodayDateString())}</Text>
      </View>

      {/* Today's Dinner Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tonight's Dinner</Text>
        {todayPlan ? (
          <TouchableOpacity
            style={styles.todayCard}
            onPress={() => {
              if (todayPlan.recipeId && typeof todayPlan.recipeId !== 'string') {
                navigateToRecipe(todayPlan.recipeId as Recipe);
              }
            }}
            activeOpacity={0.9}
          >
            {todayPlan.recipeId && typeof todayPlan.recipeId !== 'string' ? (
              <>
                {(todayPlan.recipeId as Recipe).imageUrl ? (
                  <Image
                    source={{ uri: (todayPlan.recipeId as Recipe).imageUrl }}
                    style={styles.todayImage}
                  />
                ) : (
                  <View style={styles.todayImagePlaceholder}>
                    <Text style={styles.placeholderEmoji}>🍽️</Text>
                  </View>
                )}
                <View style={styles.todayOverlay}>
                  <Text style={styles.todayTitle}>{(todayPlan.recipeId as Recipe).title}</Text>
                  <View style={styles.todayMeta}>
                    {(todayPlan.recipeId as Recipe).cookTime && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={16} color={colors.white} />
                        <Text style={styles.metaText}>
                          {(todayPlan.recipeId as Recipe).cookTime} min
                        </Text>
                      </View>
                    )}
                    {(todayPlan.recipeId as Recipe).complexity && (
                      <View style={styles.metaItem}>
                        <Ionicons name="speedometer-outline" size={16} color={colors.white} />
                        <Text style={styles.metaText}>
                          {(todayPlan.recipeId as Recipe).complexity}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.startCookingButton}
                    onPress={() => navigateToRecipe(todayPlan.recipeId as Recipe)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.startCookingText}>Start Cooking</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </>
            ) : todayPlan.label ? (
              <View style={[
                styles.labelCard,
                todayPlan.label === 'Eating Out' && styles.eatingOutCard,
                todayPlan.label === 'TBD' && styles.tbdCard
              ]}>
                <Text style={styles.labelCardEmoji}>
                  {todayPlan.label === 'Eating Out' ? '🍽️' : '❓'}
                </Text>
                <Text style={[
                  styles.labelCardText,
                  todayPlan.label === 'Eating Out' && styles.eatingOutText,
                  todayPlan.label === 'TBD' && styles.tbdText
                ]}>{todayPlan.label}</Text>
                <Text style={styles.labelCardSubtext}>
                  {todayPlan.label === 'Eating Out' ? 'Enjoy your meal out!' : 'Decision pending'}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.noPlanCard}
            onPress={recipeCount > 0 ? navigateToPlanWeek : navigateToAddRecipe}
            activeOpacity={0.8}
          >
            <View style={styles.noPlanContent}>
              <Text style={styles.noPlanEmoji}>{recipeCount > 0 ? '🤔' : '📝'}</Text>
              <Text style={styles.noPlanTitle}>
                {recipeCount > 0 ? 'No dinner planned yet' : 'No recipes yet'}
              </Text>
              <Text style={styles.noPlanSubtext}>
                {recipeCount > 0
                  ? 'Tap here to plan your week\'s meals'
                  : 'Add some recipes to start planning'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={navigateToPlanWeek}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="calendar" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Plan Week</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={navigateToAddRecipe}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.secondaryLight }]}>
              <Ionicons name="add-circle" size={24} color={colors.secondary} />
            </View>
            <Text style={styles.actionLabel}>Add Recipe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={navigateToRecipes}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="book" size={24} color="#FF9800" />
            </View>
            <Text style={styles.actionLabel}>Browse</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recipe Spotlight */}
      {spotlightRecipe && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recipe Inspiration</Text>
            <TouchableOpacity onPress={navigateToRecipes}>
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.spotlightCard}
            onPress={() => navigateToRecipe(spotlightRecipe)}
            activeOpacity={0.9}
          >
            {spotlightRecipe.imageUrl ? (
              <Image
                source={{ uri: spotlightRecipe.imageUrl }}
                style={styles.spotlightImage}
              />
            ) : (
              <View style={styles.spotlightImagePlaceholder}>
                <Text style={styles.spotlightPlaceholderEmoji}>🍳</Text>
              </View>
            )}
            <View style={styles.spotlightContent}>
              <Text style={styles.spotlightTitle} numberOfLines={2}>
                {spotlightRecipe.title}
              </Text>
              <View style={styles.spotlightMeta}>
                {spotlightRecipe.cookTime && (
                  <View style={styles.spotlightMetaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.spotlightMetaText}>
                      {spotlightRecipe.cookTime} min
                    </Text>
                  </View>
                )}
                {spotlightRecipe.isVegetarian && (
                  <View style={styles.vegBadge}>
                    <Ionicons name="leaf" size={12} color={colors.secondary} />
                    <Text style={styles.vegBadgeText}>Veggie</Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Summary */}
      <View style={styles.section}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{recipeCount}</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statCard} onPress={navigateToPlanner}>
            <Ionicons name="calendar-outline" size={28} color={colors.primary} />
            <Text style={styles.statLabel}>View Planner</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom padding */}
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  greeting: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
  },
  dateText: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
    marginBottom: spacing.md,
  },
  seeAllLink: {
    fontSize: typography.sizes.small,
    color: colors.primary,
    fontWeight: typography.weights.medium as any,
  },
  // Today's Dinner Card
  todayCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    height: 220,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  todayImage: {
    width: '100%',
    height: '100%',
  },
  todayImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  todayOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingTop: spacing.xl * 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  todayTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold as any,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  todayMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.sizes.small,
    color: colors.white,
  },
  startCookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  startCookingText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.primary,
  },
  labelCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    borderWidth: 3,
  },
  eatingOutCard: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  tbdCard: {
    backgroundColor: '#F5F5F5',
    borderColor: '#9E9E9E',
  },
  labelCardEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  labelCardText: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold as any,
    marginBottom: spacing.xs,
  },
  eatingOutText: {
    color: '#E65100',
  },
  tbdText: {
    color: '#616161',
  },
  labelCardSubtext: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
  },
  eatingOutSubtext: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  noPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  noPlanContent: {
    flex: 1,
  },
  noPlanEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  noPlanTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
  },
  noPlanSubtext: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
    textAlign: 'center',
  },
  // Spotlight Card
  spotlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  spotlightImage: {
    width: 80,
    height: 80,
  },
  spotlightImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotlightPlaceholderEmoji: {
    fontSize: 32,
  },
  spotlightContent: {
    flex: 1,
    padding: spacing.md,
  },
  spotlightTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  spotlightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  spotlightMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  spotlightMetaText: {
    fontSize: typography.sizes.small,
    color: colors.textMuted,
  },
  vegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  vegBadgeText: {
    fontSize: typography.sizes.tiny,
    color: colors.secondary,
    fontWeight: typography.weights.medium as any,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  statNumber: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold as any,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
});
