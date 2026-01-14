import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { recipeApi } from '../../services/api/recipes';
import { planApi } from '../../services/api/plans';
import { Recipe } from '../../types';
import { PlannerStackParamList } from '../../navigation/BottomTabNavigator';
import { alertManager } from '../../utils/alertUtils';

type RecipePickerScreenNavigationProp = NativeStackNavigationProp<
  PlannerStackParamList,
  'RecipePicker'
>;

type RecipePickerScreenRouteProp = RouteProp<PlannerStackParamList, 'RecipePicker'>;

type RecipeSection = {
  title: string;
  data: Recipe[];
};

interface Props {
  navigation: RecipePickerScreenNavigationProp;
  route: RecipePickerScreenRouteProp;
}

export default function RecipePickerScreen({ navigation, route }: Props) {
  const { date } = route.params;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeSections, setRecipeSections] = useState<RecipeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchQuery]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await recipeApi.getAll();
      setRecipes(data);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = [...recipes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(query) ||
          recipe.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort by title ascending
    filtered.sort((a, b) => a.title.localeCompare(b.title));

    // Group by first letter
    const sections: RecipeSection[] = [];
    const grouped: { [key: string]: Recipe[] } = {};

    filtered.forEach((recipe) => {
      const firstLetter = recipe.title.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(recipe);
    });

    // Convert to array of sections and sort alphabetically
    Object.keys(grouped)
      .sort()
      .forEach((letter) => {
        sections.push({
          title: letter,
          data: grouped[letter],
        });
      });

    setRecipeSections(sections);
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    try {
      console.log('Selecting recipe:', recipe.title, 'for date:', date);
      // Update the plan with the selected recipe
      const updatedPlan = await planApi.updateByDate(date, {
        recipeId: recipe._id,
        isConfirmed: false,
      });
      console.log('Plan updated successfully:', updatedPlan);

      // Go back to the planner screen
      navigation.goBack();
    } catch (error) {
      console.error('Error selecting recipe:', error);
      alertManager.showError({
        title: 'Error',
        message: 'Failed to select recipe. Please try again.',
      });
    }
  };

  const handleEatingOut = async () => {
    try {
      console.log('Marking as Eating Out for date:', date);
      // Update the plan with eating out label
      const updatedPlan = await planApi.updateByDate(date, {
        label: 'Eating Out',
        isConfirmed: false,
      });
      console.log('Plan updated successfully:', updatedPlan);

      // Go back to the planner screen
      navigation.goBack();
    } catch (error) {
      console.error('Error marking as eating out:', error);
      alertManager.showError({
        title: 'Error',
        message: 'Failed to mark as eating out. Please try again.',
      });
    }
  };

  const handleTBD = async () => {
    try {
      console.log('Marking as TBD for date:', date);
      // Update the plan with TBD label
      const updatedPlan = await planApi.updateByDate(date, {
        label: 'TBD',
        isConfirmed: false,
      });
      console.log('Plan updated successfully:', updatedPlan);

      // Go back to the planner screen
      navigation.goBack();
    } catch (error) {
      console.error('Error marking as TBD:', error);
      alertManager.showError({
        title: 'Error',
        message: 'Failed to mark as TBD. Please try again.',
      });
    }
  };

  const renderSectionHeader = ({ section }: { section: RecipeSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => handleSelectRecipe(item)}
      activeOpacity={0.7}
    >
      <View style={styles.recipeContent}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} />
        ) : (
          <View style={styles.recipeImagePlaceholder}>
            <Ionicons name="restaurant-outline" size={24} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.recipeMeta}>
            {item.isVegetarian && (
              <View style={[styles.badge, { backgroundColor: colors.secondary + '40' }]}>
                <Ionicons name="leaf" size={12} color={colors.secondary} />
              </View>
            )}
            {item.cookTime && item.cookTime > 0 && (
              <View style={styles.timeInfo}>
                <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                <Text style={styles.timeText}>{item.cookTime} min</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.primary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Special Action Buttons */}
      <View style={styles.specialActionsContainer}>
        <TouchableOpacity
          style={[styles.specialActionCard, styles.eatingOutCard]}
          onPress={handleEatingOut}
          activeOpacity={0.7}
        >
          <Text style={styles.specialActionEmoji}>🍽️</Text>
          <Text style={styles.specialActionTitle}>Eating Out</Text>
          <Text style={styles.specialActionSubtitle}>No cooking tonight</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.specialActionCard, styles.tbdCard]}
          onPress={handleTBD}
          activeOpacity={0.7}
        >
          <Text style={styles.specialActionEmoji}>❓</Text>
          <Text style={styles.specialActionTitle}>TBD</Text>
          <Text style={styles.specialActionSubtitle}>Decide later</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR PICK A RECIPE</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recipe List */}
      {recipeSections.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>
            {recipes.length === 0 ? '👩‍🍳' : '🔍'}
          </Text>
          <Text style={styles.emptyText}>
            {recipes.length === 0 ? 'No recipes available' : 'No matching recipes'}
          </Text>
          <Text style={styles.emptySubtext}>
            {recipes.length === 0
              ? 'Add some recipes first to pick one for this day.'
              : 'Try adjusting your search to find what you\'re looking for.'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={recipeSections}
          renderItem={renderRecipe}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={true}
        />
      )}
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
    padding: spacing.lg,
  },
  // Special Action Buttons
  specialActionsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  specialActionCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    ...shadows.card,
  },
  eatingOutCard: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  tbdCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#9E9E9E',
  },
  specialActionEmoji: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  specialActionTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    marginBottom: 2,
  },
  specialActionSubtitle: {
    fontSize: typography.sizes.tiny,
    color: colors.textLight,
    textAlign: 'center',
  },
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: typography.sizes.tiny,
    fontWeight: typography.weights.semibold as any,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
    letterSpacing: 0.5,
  },
  searchContainer: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionHeaderText: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold as any,
    color: colors.primary,
  },
  recipeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card,
  },
  recipeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    backgroundColor: colors.border,
  },
  recipeImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  badgeText: {
    fontSize: typography.sizes.tiny,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timeText: {
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
});
