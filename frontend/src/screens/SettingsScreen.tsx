import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { planApi } from '../services/api/plans';
import { recipeApi } from '../services/api/recipes';
import { useAuth } from '../contexts/AuthContext';
import { alertManager } from '../utils/alertUtils';

// Get version info from app config (extra values come from version.json via app.config.js)
const appVersion = Constants.expoConfig?.extra?.appVersion || Constants.expoConfig?.version || '1.0.0';
const buildNumber = Constants.expoConfig?.extra?.buildNumber || 1;

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  loading?: boolean;
};

function SettingRow({
  icon,
  iconColor = colors.textLight,
  title,
  subtitle,
  onPress,
  rightElement,
  destructive,
  loading,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress || loading}
      activeOpacity={onPress && !loading ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Ionicons name={icon} size={20} color={iconColor} />
        )}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, destructive && styles.settingTitleDestructive]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && !loading && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      ))}
    </TouchableOpacity>
  );
}

type SettingsRouteProp = RouteProp<{ Settings: { token?: string } }, 'Settings'>;

export default function SettingsScreen() {
  const { user, logout, refreshUser } = useAuth();
  const route = useRoute<SettingsRouteProp>();
  const [defaultAvoidRepeats, setDefaultAvoidRepeats] = useState(true);
  const [defaultUseAI, setDefaultUseAI] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Handle invitation token from deep link
  useEffect(() => {
    const token = route.params?.token;
    if (token && user) {
      // Small delay to ensure the component is fully mounted
      setTimeout(() => {
        handleJoinHouseholdFromLink(token);
      }, 500);
    }
  }, [route.params?.token, user]);

  const handleJoinHouseholdFromLink = (token: string) => {
    if (user?.householdId) {
      Alert.alert(
        'Already in Household',
        'You are already a member of a household. You must leave your current household before joining another one.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Join Household',
      'You\'ve been invited to join a household. Would you like to join?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            try {
              // Import householdApi here to avoid circular dependency
              const { householdApi } = await import('../services/api');
              await householdApi.joinHousehold({ token });
              await refreshUser(); // Refresh user data
              alertManager.showSuccess({
                title: 'Success',
                message: 'Successfully joined household!',
              });
            } catch (error: any) {
              console.error('Error joining household:', error);
              alertManager.showError({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to join household',
              });
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoggingOut(true);
              await logout();
            } catch (error) {
              console.error('Error logging out:', error);
              alertManager.showError({
                title: 'Error',
                message: 'Failed to log out. Please try again.',
              });
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleExportRecipes = async () => {
    try {
      setExporting(true); // Show loading state

      // Fetch all recipes
      const recipes = await recipeApi.getAll();

      if (recipes.length === 0) {
        alertManager.showError({
          title: 'No Recipes',
          message: 'You don\'t have any recipes to export.',
        });
        return;
      }

      // Create export data with metadata
      const exportData = {
        exportDate: new Date().toISOString(),
        totalRecipes: recipes.length,
        appVersion: appVersion,
        buildNumber: buildNumber,
        recipes: recipes,
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `meal-mate-recipes-${timestamp}.json`;

      // Get the document directory
      const fileUri = FileSystem.documentDirectory + filename;

      // Write the file
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Recipes',
        });
      } else {
        alertManager.showSuccess({
          title: 'Export Complete',
          message: `Your recipes have been saved as ${filename}. Check your device's download folder.`,
        });
      }
    } catch (error) {
      console.error('Error exporting recipes:', error);
      alertManager.showError({
        title: 'Export Failed',
        message: 'Failed to export recipes. Please try again.',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleSendFeedback = () => {
    Linking.openURL('mailto:feedback@mealmate.app?subject=Meal%20Mate%20Feedback');
  };

  const renderToggle = (isActive: boolean) => (
    <View style={[styles.toggle, isActive && styles.toggleActive]}>
      <View style={[styles.toggleKnob, isActive && styles.toggleKnobActive]} />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your planning experience</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.accountInfo}>
            <View style={styles.accountAvatar}>
              <Text style={styles.accountAvatarText}>
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
              </Text>
            </View>
            <View style={styles.accountDetails}>
              <Text style={styles.accountName}>{user?.name || 'User'}</Text>
              <Text style={styles.accountEmail}>{user?.email || ''}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <SettingRow
            icon="log-out-outline"
            iconColor={colors.error}
            title={loggingOut ? 'Logging out...' : 'Log Out'}
            subtitle="Sign out of your account"
            onPress={loggingOut ? undefined : handleLogout}
            destructive
          />
        </View>
      </View>

      {/* Planning Defaults Section (admin only) */}
      {user?.role === 'admin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planning Defaults</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setDefaultAvoidRepeats(!defaultAvoidRepeats)}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name="refresh-outline" size={20} color={colors.secondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Avoid Recent Repeats</Text>
                <Text style={styles.settingSubtitle}>Skip recipes used in last 10 days</Text>
              </View>
              {renderToggle(defaultAvoidRepeats)}
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setDefaultUseAI(!defaultUseAI)}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="flash-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Use AI Suggestions</Text>
                <Text style={styles.settingSubtitle}>Enhance suggestions with Claude AI</Text>
              </View>
              {renderToggle(defaultUseAI)}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Data</Text>
        <View style={styles.card}>
          <SettingRow
            icon="download-outline"
            iconColor={colors.secondary}
            title="Export Recipes"
            subtitle="Download your recipes as a file"
            onPress={handleExportRecipes}
            loading={exporting}
          />
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <SettingRow
            icon="chatbubble-outline"
            iconColor={colors.primary}
            title="Send Feedback"
            subtitle="Help us improve the app"
            onPress={handleSendFeedback}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="information-circle-outline"
            iconColor={colors.textLight}
            title="Version"
            rightElement={<Text style={styles.versionText}>{appVersion} ({buildNumber})</Text>}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerEmoji}>🍽️</Text>
        <Text style={styles.footerText}>Made with love for Sunday planners</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold as any,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.card,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
  },
  settingTitleDestructive: {
    color: colors.error,
  },
  settingSubtitle: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.md + 36 + spacing.md, // icon container + margin
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
  versionText: {
    fontSize: typography.sizes.body,
    color: colors.textMuted,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  accountAvatarText: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: typography.weights.bold as any,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
  },
  accountEmail: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
  },
  footerEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  footerText: {
    fontSize: typography.sizes.small,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
