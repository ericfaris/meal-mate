import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { recipeApi } from '../services/api';
import { Recipe } from '../types';
import { colors, typography, spacing, borderRadius, shadows, heights } from '../theme';

type FilterType = 'all' | 'vegetarian' | 'simple';

type RecipeSection = {
  title: string;
  data: Recipe[];
};

type Props = {
  navigation: any;
};

export default function RecipesScreen({ navigation }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeSections, setRecipeSections] = useState<RecipeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Reload recipes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [])
  );

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchQuery, activeFilter]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await recipeApi.getAll();
      setRecipes(data);
    } catch (error) {
      console.error('Error loading recipes:', error);
      Alert.alert('Error', 'Failed to load recipes. Check your connection.');
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

    // Apply category filter
    switch (activeFilter) {
      case 'vegetarian':
        filtered = filtered.filter((recipe) => recipe.isVegetarian);
        break;
      case 'simple':
        filtered = filtered.filter((recipe) => recipe.complexity === 'simple');
        break;
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

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  const handleAddRecipe = () => {
    navigation.navigate('RecipeEntry', { mode: 'create' });
  };

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'simple':
        return colors.tagSimple;
      case 'medium':
        return colors.tagMedium;
      case 'complex':
        return colors.tagComplex;
      default:
        return colors.border;
    }
  };

  const renderFilterChip = (filter: FilterType, label: string) => (
    <TouchableOpacity
      style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
      onPress={() => setActiveFilter(filter)}
    >
      <Text
        style={[
          styles.filterChipText,
          activeFilter === filter && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: RecipeSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity style={styles.recipeCard} onPress={() => handleRecipePress(item)}>
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
              <View style={[styles.badge, { backgroundColor: getComplexityColor(item.complexity) }]}>
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
          {item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {item.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
              )}
            </View>
          )}
        </View>
      </View>
      {item.planCount !== undefined && (
        <View style={styles.planCountBadge}>
          <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
          <Text style={styles.planCountText}>{item.planCount}</Text>
        </View>
      )}
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
      {recipeSections.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>
            {recipes.length === 0 ? '👩‍🍳' : '🔍'}
          </Text>
          <Text style={styles.emptyText}>
            {recipes.length === 0 ? 'Start your recipe collection!' : 'No matching recipes'}
          </Text>
          <Text style={styles.emptySubtext}>
            {recipes.length === 0
              ? 'Import from your favorite cooking sites or add recipes manually. Your dinner planning starts here!'
              : 'Try adjusting your search or filters to find what you\'re looking for.'}
          </Text>
          {recipes.length === 0 && (
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddRecipe}>
              <Ionicons name="add" size={20} color={colors.textOnPrimary} />
              <Text style={styles.emptyButtonText}>Add Your First Recipe</Text>
            </TouchableOpacity>
          )}
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

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddRecipe}>
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>
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
    height: heights.input,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
  },
  filterChipTextActive: {
    color: colors.textOnPrimary,
    fontWeight: typography.weights.medium,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100, // Space for FAB
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
    overflow: 'hidden',
    position: 'relative',
    ...shadows.card,
  },
  recipeContent: {
    flexDirection: 'row',
  },
  planCountBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  planCountText: {
    fontSize: typography.sizes.tiny * 1.25,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  recipeImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.border,
  },
  recipeImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    flex: 1,
    padding: spacing.md,
  },
  recipeTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
    fontWeight: typography.weights.medium,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.secondary + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  tagText: {
    color: colors.text,
    fontSize: typography.sizes.tiny,
  },
  moreTagsText: {
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
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
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.button,
  },
  emptyButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.floating,
  },
});
