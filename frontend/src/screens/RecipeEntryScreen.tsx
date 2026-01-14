import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// WebView is only available on native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}
import { colors, typography, spacing, borderRadius, shadows, heights } from '../theme';
import { Recipe } from '../types';
import { recipeApi } from '../services/api/recipes';
import { recipeImportApi } from '../services/api/recipeImport';
import RecipeSavedModal from '../components/RecipeSavedModal';
import ErrorModal from '../components/ErrorModal';
import { useAuth } from '../contexts/AuthContext';
import { alertManager } from '../utils/alertUtils';

type Props = {
  route: { params?: { recipe?: Recipe; mode?: 'create' | 'edit' } };
  navigation: any;
};

type Tab = 'import' | 'browse' | 'manual';

const DEFAULT_RECIPE_SITES = [
  { name: 'AllRecipes', url: 'https://www.allrecipes.com' },
  { name: 'Food Network', url: 'https://www.foodnetwork.com/recipes' },
  { name: 'Serious Eats', url: 'https://www.seriouseats.com/recipes' },
  { name: 'Bon Appetit', url: 'https://www.bonappetit.com/recipes' },
  { name: 'Epicurious', url: 'https://www.epicurious.com/recipes-menus' },
];

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

  // Browser state
  const webViewRef = useRef<any>(null);
  const [browserUrl, setBrowserUrl] = useState('https://www.google.com/search?q=dinner+recipes');
  const [currentUrl, setCurrentUrl] = useState(browserUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savingFromBrowser, setSavingFromBrowser] = useState(false);

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

  const handleSaveFromBrowser = async () => {
    if (!currentUrl || currentUrl === 'about:blank') {
      showError('Error', 'Please navigate to a recipe page first');
      return;
    }

    setSavingFromBrowser(true);
    try {
      const recipe = await recipeImportApi.importFromUrl(currentUrl);
      // Show success modal instead of alert
      setSavedRecipe(recipe);
      setShowSuccessModal(true);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to import recipe. This page may not contain a recognized recipe format.';
      showError('Import Failed', message);
    } finally {
      setSavingFromBrowser(false);
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
        style={[styles.tab, activeTab === 'browse' && styles.tabActive]}
        onPress={() => setActiveTab('browse')}
        disabled={isEditMode}
      >
        <Ionicons
          name="globe-outline"
          size={18}
          color={activeTab === 'browse' ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}>
          Browse Web
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

  const renderBrowseTab = () => {
    // WebView is not available on web platform
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webFallbackContainer}>
          <View style={styles.webFallbackContent}>
            <Ionicons name="phone-portrait-outline" size={64} color={colors.textMuted} />
            <Text style={styles.webFallbackTitle}>Browser Not Available</Text>
            <Text style={styles.webFallbackText}>
              The in-app browser is only available on mobile devices. On web, please use the URL import tab to paste recipe links directly.
            </Text>
            <TouchableOpacity
              style={styles.webFallbackButton}
              onPress={() => setActiveTab('import')}
            >
              <Ionicons name="link-outline" size={20} color={colors.textOnPrimary} />
              <Text style={styles.webFallbackButtonText}>Go to URL Import</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickLinksWeb}>
            <Text style={styles.quickLinksWebTitle}>Or visit these sites in a new tab:</Text>
            <View style={styles.quickLinksWebGrid}>
              {DEFAULT_RECIPE_SITES.map((site) => (
                <TouchableOpacity
                  key={site.name}
                  style={styles.quickLinkWebChip}
                  onPress={() => Linking.openURL(site.url)}
                >
                  <Ionicons name="open-outline" size={14} color={colors.primary} />
                  <Text style={styles.quickLinkWebText}>{site.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.browserContainer}>
        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <Text style={styles.quickLinksLabel}>Quick access:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickLinksScroll}>
            {DEFAULT_RECIPE_SITES.map((site) => (
              <TouchableOpacity
                key={site.name}
                style={styles.quickLinkChip}
                onPress={() => {
                  setBrowserUrl(site.url);
                  setCurrentUrl(site.url);
                }}
              >
                <Text style={styles.quickLinkText}>{site.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Browser Navigation Bar */}
        <View style={styles.browserNav}>
          <TouchableOpacity
            style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
            onPress={() => webViewRef.current?.goBack()}
            disabled={!canGoBack}
          >
            <Ionicons name="chevron-back" size={24} color={canGoBack ? colors.text : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
            onPress={() => webViewRef.current?.goForward()}
            disabled={!canGoForward}
          >
            <Ionicons name="chevron-forward" size={24} color={canGoForward ? colors.text : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => webViewRef.current?.reload()}
          >
            <Ionicons name="refresh" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.urlBar}>
            <Ionicons name="globe-outline" size={16} color={colors.textMuted} />
            <Text style={styles.urlText} numberOfLines={1}>
              {currentUrl}
            </Text>
          </View>
        </View>

        {/* WebView */}
        <View style={styles.webViewContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          {WebView && (
            <WebView
              ref={webViewRef}
              source={{ uri: browserUrl }}
              style={styles.webView}
              onNavigationStateChange={(navState: any) => {
                setCurrentUrl(navState.url);
                setCanGoBack(navState.canGoBack);
                setCanGoForward(navState.canGoForward);
              }}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
            />
          )}
        </View>

        {/* Save Recipe FAB */}
        <TouchableOpacity
          style={[styles.saveFab, savingFromBrowser && styles.saveFabDisabled]}
          onPress={handleSaveFromBrowser}
          disabled={savingFromBrowser}
        >
          {savingFromBrowser ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <>
              <Ionicons name="bookmark" size={20} color={colors.textOnPrimary} />
              <Text style={styles.saveFabText}>Import This Page</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

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

  const renderContent = () => {
    if (isEditMode) {
      return renderManualTab();
    }

    switch (activeTab) {
      case 'import':
        return renderImportTab();
      case 'browse':
        return renderBrowseTab();
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
  // Browse Tab
  browserContainer: {
    flex: 1,
  },
  browserNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  navButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  urlBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  urlText: {
    flex: 1,
    fontSize: typography.sizes.small,
    color: colors.textLight,
  },
  quickLinks: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickLinksLabel: {
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickLinksScroll: {
    gap: spacing.sm,
  },
  quickLinkChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  quickLinkText: {
    fontSize: typography.sizes.small,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 0,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  saveFab: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.floating,
  },
  saveFabDisabled: {
    backgroundColor: colors.textMuted,
  },
  saveFabText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textOnPrimary,
  },
  // Web Fallback (when WebView is not available)
  webFallbackContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  webFallbackContent: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  webFallbackTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  webFallbackText: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  webFallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.button,
  },
  webFallbackButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
  },
  quickLinksWeb: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  quickLinksWebTitle: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  quickLinksWebGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  quickLinkWebChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  quickLinkWebText: {
    fontSize: typography.sizes.small,
    color: colors.primary,
    fontWeight: typography.weights.medium,
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
