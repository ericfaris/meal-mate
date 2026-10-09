import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { Ionicons } from '../components/icons/Ionicons';
import { colors, typography, spacing, borderRadius, shadows, heights } from '../theme';
import { Recipe } from '../types';
import { recipeApi } from '../services/api/recipes';
import { recipeImportApi } from '../services/api/recipeImport';
import { recipePhotoImportApi } from '../services/api/recipePhotoImport';
import RecipeSavedModal from '../components/RecipeSavedModal';
import ErrorModal from '../components/ErrorModal';
import { useAuth } from '../contexts/AuthContext';
import { alertManager } from '../utils/alertUtils';
import { pickImageFile } from '../utils/fileUtils';

type Props = {
  route: { params?: { recipe?: Recipe; mode?: 'create' | 'edit' } };
  navigation: any;
};

type Tab = 'import' | 'photo' | 'manual';

export default function RecipeEntryScreen({ route, navigation }: Props) {
  const existingRecipe = route.params?.recipe;
  const isEditMode = route.params?.mode === 'edit';
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Check permissions for edit mode
  useEffect(() => {
    if (isEditMode && !isAdmin) {
      alertManager.showError({
        title: 'Access Denied',
        message: 'Only household admins can edit recipes.',
      });
      navigation.goBack();
      return;
    }
  }, [isEditMode, isAdmin, navigation]);

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>(isEditMode ? 'manual' : 'import');

  // Import state
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  // Form state
  const [title, setTitle] = useState(existingRecipe?.title || '');
  const [ingredientsText, setIngredientsText] = useState(existingRecipe?.ingredientsText || '');
  const [directionsText, setDirectionsText] = useState(existingRecipe?.directionsText || '');
  const [notes, setNotes] = useState(existingRecipe?.notes || '');
  const [imageUrl, setImageUrl] = useState(existingRecipe?.imageUrl || '');
  const [sourceUrl, setSourceUrl] = useState(existingRecipe?.sourceUrl || '');
  const [tags, setTags] = useState(existingRecipe?.tags?.join(', ') || '');
  const [prepTime, setPrepTime] = useState(existingRecipe?.prepTime?.toString() || '');
  const [cookTime, setCookTime] = useState(existingRecipe?.cookTime?.toString() || '');
  const [servings, setServings] = useState(existingRecipe?.servings?.toString() || '');

  // Photo tab state
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedRecipe, setSavedRecipe] = useState<Recipe | null>(null);

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Helper function to show error modal
  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  // Set header title
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit Recipe' : 'Add Recipe',
    });
  }, [isEditMode, navigation]);

  const handleImport = async () => {
    if (!importUrl.trim()) {
      showError('Error', 'Please enter a recipe URL');
      return;
    }

    setImporting(true);
    try {
      const recipe = await recipeImportApi.importFromUrl(importUrl.trim());
      // Show success modal instead of alert
      setSavedRecipe(recipe);
      setShowSuccessModal(true);
      setImportUrl('');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to import recipe. Please try again.';
      showError('Import Failed', message);
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      showError('Error', 'Recipe title is required');
      return;
    }

    setSaving(true);
    try {
      const recipeData = {
        title: title.trim(),
        ingredientsText: ingredientsText.trim(),
        directionsText: directionsText.trim(),
        notes: notes.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        prepTime: prepTime ? parseInt(prepTime) : undefined,
        cookTime: cookTime ? parseInt(cookTime) : undefined,
        servings: servings ? parseInt(servings) : undefined,
      };

      let newSavedRecipe: Recipe;
      if (isEditMode && existingRecipe) {
        newSavedRecipe = await recipeApi.update(existingRecipe._id, recipeData);
        // For edits, show saved animation on button and navigate back after delay
        setSavedRecipe(newSavedRecipe);
        setShowSaved(true);
        setTimeout(() => {
          setShowSaved(false);
          navigation.goBack();
        }, 1500);
      } else {
        // For new recipes, show the celebration modal!
        newSavedRecipe = await recipeApi.create(recipeData);
        setSavedRecipe(newSavedRecipe);
        setShowSuccessModal(true);
        // Clear the form
        setTitle('');
        setIngredientsText('');
        setDirectionsText('');
        setNotes('');
        setImageUrl('');
        setSourceUrl('');
        setTags('');
        setPrepTime('');
        setCookTime('');
        setServings('');
      }
    } catch (error) {
      showError('Error', `Failed to ${isEditMode ? 'update' : 'save'} recipe. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'import' && styles.tabActive]}
        onPress={() => setActiveTab('import')}
        disabled={isEditMode}
      >
        <Ionicons
          name="link-outline"
          size={18}
          color={activeTab === 'import' ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.tabText, activeTab === 'import' && styles.tabTextActive]}>
          URL
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'photo' && styles.tabActive]}
        onPress={() => setActiveTab('photo')}
        disabled={isEditMode}
      >
        <Ionicons
          name="camera-outline"
          size={18}
          color={activeTab === 'photo' ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.tabText, activeTab === 'photo' && styles.tabTextActive]}>
          Photo
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'manual' && styles.tabActive]}
        onPress={() => setActiveTab('manual')}
      >
        <Ionicons
          name="create-outline"
          size={18}
          color={activeTab === 'manual' ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>
          Manual
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderImportTab = () => (
    <View style={styles.importContainer}>
      <View style={styles.importHeader}>
        <Text style={styles.importTitle}>Paste a recipe URL</Text>
        <Text style={styles.importSubtitle}>
          We'll automatically extract the recipe details for you
        </Text>
      </View>

      <TextInput
        style={styles.urlInput}
        placeholder="https://example.com/recipe..."
        placeholderTextColor={colors.textMuted}
        value={importUrl}
        onChangeText={setImportUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <TouchableOpacity
        style={[styles.importButton, !importUrl.trim() && styles.importButtonDisabled]}
        onPress={handleImport}
        disabled={importing || !importUrl.trim()}
      >
        {importing ? (
          <ActivityIndicator size="small" color={colors.textOnPrimary} />
        ) : (
          <>
            <Ionicons name="download-outline" size={20} color={colors.textOnPrimary} />
            <Text style={styles.importButtonText}>Import Recipe</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.supportedSites}>
        Works with most popular recipe sites like AllRecipes, Food Network, NYT Cooking, and more!
      </Text>
    </View>
  );

  const renderManualTab = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Recipe Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Sheet Pan Chicken Fajitas"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Ingredients */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Ingredients *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter each ingredient on a new line..."
          placeholderTextColor={colors.textMuted}
          value={ingredientsText}
          onChangeText={setIngredientsText}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Directions */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Directions *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter each step on a new line..."
          placeholderTextColor={colors.textMuted}
          value={directionsText}
          onChangeText={setDirectionsText}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Notes */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textAreaSmall]}
          placeholder="Any tips or variations..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Time & Servings Row */}
      <View style={styles.rowGroup}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Prep Time</Text>
          <TextInput
            style={styles.input}
            placeholder="min"
            placeholderTextColor={colors.textMuted}
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="number-pad"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Cook Time</Text>
          <TextInput
            style={styles.input}
            placeholder="min"
            placeholderTextColor={colors.textMuted}
            value={cookTime}
            onChangeText={setCookTime}
            keyboardType="number-pad"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Servings</Text>
          <TextInput
            style={styles.input}
            placeholder="#"
            placeholderTextColor={colors.textMuted}
            value={servings}
            onChangeText={setServings}
            keyboardType="number-pad"
          />
        </View>
      </View>

      {/* Tags */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Tags</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Quick, Chicken, Mexican (comma-separated)"
          placeholderTextColor={colors.textMuted}
          value={tags}
          onChangeText={setTags}
        />
      </View>

      {/* Image URL */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Image URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor={colors.textMuted}
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>

      {/* Source URL */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Source URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor={colors.textMuted}
          value={sourceUrl}
          onChangeText={setSourceUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          saving && styles.saveButtonDisabled,
          showSaved && styles.saveButtonSaved
        ]}
        onPress={handleSave}
        disabled={saving || showSaved}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.textOnPrimary} />
        ) : showSaved ? (
          <>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.saveButtonText, styles.saveButtonTextSaved]}>
              Changes Saved!
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="checkmark" size={20} color={colors.textOnPrimary} />
            <Text style={styles.saveButtonText}>
              {isEditMode ? 'Save Changes' : 'Save Recipe'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Bottom padding for keyboard */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const handlePickImage = async () => {
    try {
      const uri = await pickImageFile();
      if (uri) {
        console.log('[Photo] Image selected');
        setPhotoUri(uri);
      }
    } catch (error: any) {
      console.error('[Photo] Picker error:', error);
      showError('Image Error', error.message || 'Failed to choose image');
    }
  };

  const handleExtractRecipe = async () => {
    if (!photoUri) return;

    setExtracting(true);
    try {
      console.log('[Photo] Starting recipe extraction...');
      console.log('[Photo] Sending image URI:', photoUri.substring(0, 80) + '...');
      const extracted = await recipePhotoImportApi.importFromPhoto(photoUri);
      console.log('[Photo] Extraction successful:', { title: extracted.title, tagsCount: extracted.tags?.length });

      // Pre-fill the manual form fields
      setTitle(extracted.title || '');
      setIngredientsText(extracted.ingredientsText || '');
      setDirectionsText(extracted.directionsText || '');
      setPrepTime(extracted.prepTime ? String(extracted.prepTime) : '');
      setCookTime(extracted.cookTime ? String(extracted.cookTime) : '');
      setServings(extracted.servings ? String(extracted.servings) : '');
      setTags(extracted.tags?.join(', ') || '');

      // Switch to manual tab for review
      setActiveTab('manual');
      setPhotoUri(null);
    } catch (error: any) {
      console.error('[Photo] Extraction error:', error);
      console.error('[Photo] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
      });
      const message = error.response?.data?.error || 'Failed to extract recipe from photo. Please try again.';
      showError('Extraction Failed', message);
    } finally {
      setExtracting(false);
    }
  };

  const renderPhotoTab = () => (
    <ScrollView style={styles.importContainer} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={styles.importHeader}>
        <Text style={styles.importTitle}>Import from Photo</Text>
        <Text style={styles.importSubtitle}>
          Choose a photo of a recipe card, cookbook page, or screenshot
        </Text>
      </View>

      <View style={styles.photoButtonRow}>
        <TouchableOpacity
          style={[styles.photoButton, extracting && styles.importButtonDisabled]}
          onPress={handlePickImage}
          disabled={extracting}
        >
          <Ionicons name="images" size={24} color={colors.primary} />
          <Text style={styles.photoButtonText}>Choose Image</Text>
        </TouchableOpacity>
      </View>

      {photoUri && (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="contain" />
          <TouchableOpacity
            style={styles.photoRemoveButton}
            onPress={() => setPhotoUri(null)}
          >
            <Ionicons name="close-circle" size={28} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {photoUri && (
        <TouchableOpacity
          style={[styles.importButton, extracting && styles.importButtonDisabled]}
          onPress={handleExtractRecipe}
          disabled={extracting}
        >
          {extracting ? (
            <View style={styles.extractingRow}>
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
              <Text style={styles.importButtonText}>Analyzing recipe...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color={colors.textOnPrimary} />
              <Text style={styles.importButtonText}>Extract Recipe</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <Text style={styles.supportedSites}>
        Works best with clear photos of printed or handwritten recipes.
      </Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderContent = () => {
    if (isEditMode) {
      return renderManualTab();
    }

    switch (activeTab) {
      case 'import':
        return renderImportTab();
      case 'photo':
        return renderPhotoTab();
      case 'manual':
        return renderManualTab();
      default:
        return renderImportTab();
    }
  };

  // Modal handlers
  const handleViewRecipe = () => {
    setShowSuccessModal(false);
    if (savedRecipe) {
      navigation.replace('RecipeDetail', { recipe: savedRecipe });
    }
  };

  const handleAddAnother = () => {
    setShowSuccessModal(false);
    setSavedRecipe(null);
    // Stay on the current screen and current tab, ready for another entry
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setSavedRecipe(null);
    // In edit mode, go back after closing
    // In create mode, just dismiss and stay on current tab
    if (isEditMode) {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      {!isEditMode && renderTabs()}
      {renderContent()}

      {/* Success celebration modal - only for new recipes */}
      <RecipeSavedModal
        visible={showSuccessModal && !isEditMode}
        recipe={savedRecipe}
        onViewRecipe={handleViewRecipe}
        onAddAnother={handleAddAnother}
        onClose={handleCloseModal}
        notification={false}
      />

      {/* Error modal */}
      <ErrorModal
        visible={showErrorModal}
        title={errorTitle}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.small,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  // Import Tab
  importContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  importHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  importTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  importSubtitle: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    textAlign: 'center',
  },
  urlInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.sizes.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  importButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    minHeight: heights.button,
    ...shadows.button,
  },
  importButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  importButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
  },
  supportedSites: {
    fontSize: typography.sizes.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  // Photo Tab
  photoButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  photoButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  photoPreviewContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoPreview: {
    width: '100%',
    height: 300,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  extractingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Manual Tab
  formContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  rowGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
  },
  textAreaSmall: {
    minHeight: 80,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleLabel: {
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.secondary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...shadows.button,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    height: heights.button,
    marginTop: spacing.md,
    ...shadows.button,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  saveButtonSaved: {
    backgroundColor: colors.success,
  },
  saveButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
  },
  saveButtonTextSaved: {
    color: colors.white,
  },
});
