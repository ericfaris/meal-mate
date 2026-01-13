import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Recipe } from '../types';
import { recipeApi } from '../services/api/recipes';
import ImagePickerModal from '../components/ImagePickerModal';

// Helper function to parse text into list items
const parseListItems = (text: string | undefined): string[] => {
  if (!text) return [];

  // Split by newlines first
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  // If no newlines, try splitting by common delimiters
  if (lines.length === 1) {
    const singleLine = lines[0];
    // Try semicolons
    if (singleLine.includes(';')) {
      return singleLine.split(';').map(s => s.trim()).filter(Boolean);
    }
    // Try periods followed by capital letters (step indicators)
    const periodSplit = singleLine.split(/\.\s+(?=[A-Z])/);
    if (periodSplit.length > 1) {
      return periodSplit.map(s => s.trim()).filter(Boolean);
    }
  }

  return lines;
};

// Remove leading numbers/bullets from text
const cleanListItem = (text: string): string => {
  // Remove leading numbers with dots, parentheses, or colons (1. 2) 3:)
  return text.replace(/^\d+[\.\)\:]\s*/, '').trim();
};

type Props = {
  route: { params: { recipe: Recipe } };
  navigation: any;
};

export default function RecipeDetailScreen({ route, navigation }: Props) {
  const { recipe: initialRecipe } = route.params;
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const [deleting, setDeleting] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [updatingImage, setUpdatingImage] = useState(false);

  // Update recipe state when route params change (e.g., after editing)
  useEffect(() => {
    if (route.params.recipe) {
      setRecipe(route.params.recipe);
    }
  }, [route.params.recipe]);

  // Refresh recipe data when screen comes into focus (e.g., after editing)
  useFocusEffect(
    React.useCallback(() => {
      const refreshRecipe = async () => {
        if (recipe._id) {
          try {
            const updatedRecipe = await recipeApi.getById(recipe._id);
            setRecipe(updatedRecipe);
          } catch (error) {
            console.error('Error refreshing recipe:', error);
            // Keep the current recipe data if refresh fails
          }
        }
      };

      refreshRecipe();
    }, [recipe._id])
  );

  // Update header title when recipe changes
  useEffect(() => {
    navigation.setOptions({
      title: recipe.title,
    });
  }, [recipe.title, navigation]);

  const handleEdit = () => {
    navigation.navigate('RecipeEntry', { recipe, mode: 'edit' });
  };

  const handleDelete = async () => {
    // Removed confirmation dialog - just delete directly
    if (!recipe._id) {
      console.error('Error: Recipe ID is missing. Cannot delete.');
      return;
    }

    setDeleting(true);
    try {
      await recipeApi.delete(recipe._id);
      // Navigate back after successful deletion
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setDeleting(false);
    }
  };

  const handleOpenSource = () => {
    if (recipe.sourceUrl) {
      Linking.openURL(recipe.sourceUrl);
    }
  };

  const handleSelectImage = async (imageUrl: string) => {
    if (!recipe._id) {
      Alert.alert('Error', 'Cannot update recipe image');
      return;
    }

    setUpdatingImage(true);
    try {
      const updatedRecipe = await recipeApi.update(recipe._id, {
        imageUrl,
      });
      setRecipe(updatedRecipe);
      Alert.alert('Success', 'Image added successfully!');
    } catch (error) {
      console.error('Error updating recipe image:', error);
      Alert.alert('Error', 'Failed to add image. Please try again.');
    } finally {
      setUpdatingImage(false);
    }
  };

  if (deleting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Deleting recipe...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image */}
        {recipe.imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={() => setShowImagePicker(true)}
              disabled={updatingImage}
            >
              {updatingImage ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="camera" size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="restaurant-outline" size={64} color={colors.textMuted} />
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={() => setShowImagePicker(true)}
              disabled={updatingImage}
            >
              {updatingImage ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="image" size={20} color={colors.white} />
                  <Text style={styles.addImageText}>Add Image</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{recipe.title}</Text>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            {recipe.isVegetarian && (
              <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                <Text style={styles.badgeText}>Vegetarian</Text>
              </View>
            )}
            {recipe.planCount !== undefined && recipe.planCount > 0 && (
              <View style={[styles.badge, styles.planCountBadge]}>
                <Ionicons name="calendar-outline" size={16} color={colors.white} />
                <Text style={[styles.badgeText, { color: colors.white }]}>Planned {recipe.planCount}x</Text>
              </View>
            )}
          </View>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            {recipe.prepTime !== undefined && recipe.prepTime > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={18} color={colors.textLight} />
                <Text style={styles.metaText}>Prep: {recipe.prepTime} min</Text>
              </View>
            )}
            {recipe.cookTime !== undefined && recipe.cookTime > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="flame-outline" size={18} color={colors.textLight} />
                <Text style={styles.metaText}>Cook: {recipe.cookTime} min</Text>
              </View>
            )}
            {recipe.servings !== undefined && recipe.servings > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={18} color={colors.textLight} />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {recipe.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Source URL */}
          {recipe.sourceUrl && (
            <TouchableOpacity style={styles.sourceLink} onPress={handleOpenSource}>
              <Ionicons name="link-outline" size={18} color={colors.primary} />
              <Text style={styles.sourceLinkText}>View Original Recipe</Text>
            </TouchableOpacity>
          )}

          {/* Notes */}
          {recipe.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.sectionText}>{recipe.notes}</Text>
            </View>
          )}

          {/* Ingredients */}
          {recipe.ingredientsText && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {parseListItems(recipe.ingredientsText).map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Directions */}
          {recipe.directionsText && (() => {
            const directionItems = parseListItems(recipe.directionsText);

            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Directions</Text>
                {directionItems.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>
                      {index + 1}.
                    </Text>
                    <Text style={styles.listItemText}>
                      {cleanListItem(item)}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })()}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Ionicons name="pencil" size={20} color={colors.textOnPrimary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImagePicker}
        recipeTitle={recipe.title}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={handleSelectImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.body,
    color: colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: colors.border,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    ...shadows.button,
  },
  addImageText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.white,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  planCountBadge: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: colors.secondary + '40',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: typography.sizes.small,
    color: colors.text,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  sourceLinkText: {
    fontSize: typography.sizes.body,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionText: {
    fontSize: typography.sizes.body,
    color: colors.text,
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: typography.sizes.body,
    color: colors.text,
    marginRight: spacing.sm,
    minWidth: 20,
    fontWeight: typography.weights.bold,
  },
  listItemText: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text,
    lineHeight: 22,
  },
  actionBar: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.button,
  },
  editButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
});
