import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { useAuth } from '../contexts/AuthContext';

interface AvatarMenuProps {
  onSettingsPress: () => void;
  onHouseholdPress?: () => void;
}

export const AvatarMenu: React.FC<AvatarMenuProps> = ({ onSettingsPress, onHouseholdPress }) => {
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.name) return '?';
    const parts = user.name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  const showMenu = () => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideMenu = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
    });
  };

  const handleSettingsPress = () => {
    hideMenu();
    // Small delay to let animation finish
    setTimeout(() => {
      onSettingsPress();
    }, 100);
  };

  const handleHouseholdPress = () => {
    hideMenu();
    // Small delay to let animation finish
    setTimeout(() => {
      onHouseholdPress?.();
    }, 100);
  };

  const handleLogout = () => {
    hideMenu();
    // Small delay to let animation finish, then logout
    setTimeout(async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }, 100);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={showMenu}
        activeOpacity={0.7}
      >
        {user?.profilePicture ? (
          <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={hideMenu}
      >
        <Pressable style={styles.overlay} onPress={hideMenu}>
          <Animated.View
            style={[
              styles.menuContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.menu}>
              <View style={styles.menuHeader}>
                {user?.profilePicture ? (
                  <Image source={{ uri: user.profilePicture }} style={styles.menuAvatarImage} />
                ) : (
                  <View style={styles.menuAvatar}>
                    <Text style={styles.menuAvatarText}>{getInitials()}</Text>
                  </View>
                )}
                <View style={styles.menuHeaderText}>
                  <Text style={styles.menuGreeting}>
                    {user?.name || 'Welcome'}
                  </Text>
                  <Text style={styles.menuSubtext}>
                    {user?.email || 'Meal Mate User'}
                  </Text>
                </View>
              </View>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleSettingsPress}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={20} color={colors.text} />
                <Text style={styles.menuItemText}>Settings</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleHouseholdPress}
                activeOpacity={0.7}
              >
                <Ionicons name="home-outline" size={20} color={colors.text} />
                <Text style={styles.menuItemText}>Household</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: spacing.sm,
  },
  avatarButton: {
    padding: spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContainer: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
  },
  menu: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    minWidth: 260,
    ...shadows.floating,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  menuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  menuAvatarText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: typography.weights.bold,
  },
  menuHeaderText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  menuGreeting: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  menuSubtext: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  logoutText: {
    color: colors.error,
  },
});

export default AvatarMenu;
