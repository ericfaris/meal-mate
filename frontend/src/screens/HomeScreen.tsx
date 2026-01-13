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
import { submissionApi } from '../services/api/submissions';
import { getTodayString, formatDateString } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import RecipeSubmissionModal from '../components/RecipeSubmissionModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  navigation: any;
};

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [todayPlan, setTodayPlan] = useState<Plan | null>(null);
  const [spotlightRecipe, setSpotlightRecipe] = useState<Recipe | null>(null);
  const [recipeCount, setRecipeCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0);

  const isAdmin = user?.role === 'admin';

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

      // Check for pending submissions if user is admin
      if (isAdmin) {
        try {
          const submissions = await submissionApi.getPendingSubmissions();
          setPendingSubmissionsCount(submissions.length);
        } catch (error) {
          console.error('Error loading pending submissions:', error);
          setPendingSubmissionsCount(0);
        }
      }

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
    // Navigate to RecipesTab with both screens in the stack
    navigation.navigate('RecipesTab', {
      screen: 'RecipesList',
    });
    // Small delay to ensure RecipesList is mounted first
    setTimeout(() => {
      navigation.navigate('RecipesTab', {
        screen: 'RecipeDetail',
        params: { recipe },
      });
    }, 10);
  };

  const navigateToPlanner = () => {
    navigation.navigate('PlannerTab');
  };

  const navigateToRecipes = () => {
    navigation.navigate('RecipesTab');
  };

  const navigateToAddRecipe = () => {
    if (isAdmin) {
      // Admins can create recipes directly
      navigation.navigate('RecipesTab', {
        screen: 'RecipeEntry',
        params: { mode: 'create' },
      });
    } else {
      // Members see the submission modal directly
      setSubmissionModalVisible(true);
    }
  };

  const navigateToPlanWeek = () => {
    navigation.navigate('PlannerTab', {
      screen: 'PlannerHome',
      params: { showCurrentWeek: true },
    });
  };

  return (
    <View style={{ flex: 1 }}>
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

        {/* Pending Submissions Notification */}
        {isAdmin && pendingSubmissionsCount > 0 && (
          <TouchableOpacity
            style={styles.notificationCard}
            onPress={() => navigation.navigate('Household')}
            activeOpacity={0.8}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationIcon}>
                <Ionicons name="document-text-outline" size={24} color={colors.white} />
              </View>
              <View style={styles.notificationText}>
                <Text style={styles.notificationTitle}>
                  {pendingSubmissionsCount} Recipe{pendingSubmissionsCount > 1 ? 's' : ''} Awaiting Approval
                </Text>
                <Text style={styles.notificationSubtitle}>
                  Review submissions from your household members
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.white} />
            </View>
          </TouchableOpacity>
        )}

        {/* Today's Dinner Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tonight's Dinner</Text>
          {todayPlan ? (
            <TouchableOpacity
              style={styles.todayCard}
              onPress={() => {
                if (todayPlan.recipeId && typeof todayPlan.recipeId !== 'string') {
                  navigateToRecipe(todayPlan.recipeId as Recipe);
                } else if (!todayPlan.recipeId && !todayPlan.label && isAdmin) {
                  navigateToPlanWeek();
                }
              }}
              activeOpacity={0.9}
            >
              {todayPlan.recipeId && typeof todayPlan.recipeId !== 'string' ? (
                <View style={{flex: 1, width: '100%', height: '100%'}}>
                  {(todayPlan.recipeId as Recipe).imageUrl ? (
                    <Image
                      source={{ uri: (todayPlan.recipeId as Recipe).imageUrl }}
                      style={styles.todayImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.todayImagePlaceholder}>
                      <Text style={styles.placeholderEmoji}>🍽️</Text>
                    </View>
                  )}
                  <View style={styles.todayOverlay}>
                    <Text style={styles.todayTitle}>{(todayPlan.recipeId as Recipe).title}</Text>
                    <View style={styles.todayMeta}>
                      {(todayPlan.recipeId as Recipe).cookTime && (todayPlan.recipeId as Recipe).cookTime > 0 && (
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
                </View>
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
              ) : (
                <View style={styles.labelCard}>
                  <Text style={styles.labelCardEmoji}>🤔</Text>
                  <Text style={styles.labelCardText}>Plan Incomplete</Text>
                  <Text style={styles.labelCardSubtext}>
                    Tap to update tonight's plan
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.noPlanCard}
              onPress={recipeCount > 0 && isAdmin ? navigateToPlanWeek : navigateToAddRecipe}
              activeOpacity={0.8}
            >
              <View style={styles.noPlanContent}>
                <Text style={styles.noPlanEmoji}>{recipeCount > 0 && isAdmin ? '🤔' : '📝'}</Text>
                <Text style={styles.noPlanTitle}>
                  {recipeCount > 0 && isAdmin ? 'No dinner planned yet' : isAdmin ? 'No recipes yet' : 'No recipes yet'}
                </Text>
                <Text style={styles.noPlanSubtext}>
                  {recipeCount > 0 && isAdmin
                    ? 'Tap here to plan your week\'s meals'
                    : isAdmin
                      ? 'Add some recipes to start planning'
                      : 'Submit recipe suggestions to get started'}
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
            {isAdmin && (
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
            )}

            <TouchableOpacity
              style={styles.actionCard}
              onPress={navigateToAddRecipe}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: isAdmin ? colors.secondaryLight : '#E8F5E8' }]}>
                <Ionicons name={isAdmin ? "add-circle" : "paper-plane"} size={24} color={isAdmin ? colors.secondary : '#4CAF50'} />
              </View>
              <Text style={styles.actionLabel}>{isAdmin ? 'Add Recipe' : 'Submit Recipe'}</Text>
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
                  {spotlightRecipe.cookTime && spotlightRecipe.cookTime > 0 && (
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
            <TouchableOpacity style={styles.statCard} onPress={navigateToRecipes}>
              <Text style={styles.statNumber}>{recipeCount}</Text>
              <Text style={styles.statLabel}>Recipes</Text>
            </TouchableOpacity>
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

      {/* Recipe Submission Modal for Members */}
      <RecipeSubmissionModal
        visible={submissionModalVisible}
        onClose={() => setSubmissionModalVisible(false)}
        onSubmit={() => setSubmissionModalVisible(false)}
      />
    </View>
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
    // overflow: 'hidden', // Removed - causes rendering issues on Android
    height: 220,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  todayImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xl,
  },
  todayImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
  },
  todayImageBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
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
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 10,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
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
  notificationCard: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    ...shadows.sm,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  notificationTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.white,
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: typography.sizes.small,
    color: colors.white,
    opacity: 0.9,
  },
});
