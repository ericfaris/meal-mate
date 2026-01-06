import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
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
import { DaySuggestion } from '../../services/api/suggestions';
import { PlannerStackParamList } from '../../navigation/BottomTabNavigator';

type RecipePickerScreenNavigationProp = NativeStackNavigationProp<
  PlannerStackParamList,
  'RecipePicker'
>;

type RecipePickerScreenRouteProp = RouteProp<PlannerStackParamList, 'RecipePicker'>;

interface Props {
  navigation: RecipePickerScreenNavigationProp;
  route: RecipePickerScreenRouteProp;
}

export default function RecipePickerScreen({ navigation, route }: Props) {
  const { date, currentSuggestions } = route.params;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
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

    setFilteredRecipes(filtered);
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
    }
  };

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
            {item.complexity && (
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.badgeText}>
                  {item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1)}
                </Text>
              </View>
            )}
            {item.cookTime && (
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
      {filteredRecipes.length === 0 ? (
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
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
