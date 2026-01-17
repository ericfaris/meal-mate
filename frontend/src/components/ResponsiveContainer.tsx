/**
 * ResponsiveContainer
 *
 * A wrapper component that constrains content width on large screens
 * for better readability. Centers content when screen is wider than maxWidth.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive, maxContentWidth } from '../hooks/useResponsive';
import { colors } from '../theme';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  // Whether to show a background color outside the content area on desktop
  showDesktopBackground?: boolean;
}

export default function ResponsiveContainer({
  children,
  maxWidth = maxContentWidth.default,
  style,
  contentStyle,
  showDesktopBackground = true,
}: ResponsiveContainerProps) {
  const { width, isDesktop, isWeb } = useResponsive();

  // On mobile, just render children directly
  if (!isDesktop && !isWeb) {
    return (
      <View style={[styles.mobileContainer, style]}>
        {children}
      </View>
    );
  }

  // On desktop/web, constrain width and center content
  const shouldConstrain = width > maxWidth + 48;

  if (!shouldConstrain) {
    return (
      <View style={[styles.mobileContainer, style]}>
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.desktopOuter,
        showDesktopBackground && styles.desktopBackground,
        style,
      ]}
    >
      <View style={[styles.desktopContent, { maxWidth }, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

/**
 * Hook version for inline responsive width styles
 */
export function useResponsiveWidth(maxWidth: number = maxContentWidth.default) {
  const { width, isDesktop, isWeb } = useResponsive();

  if ((!isDesktop && !isWeb) || width <= maxWidth + 48) {
    return {
      containerStyle: {},
      contentStyle: {},
    };
  }

  return {
    containerStyle: {
      alignItems: 'center' as const,
      backgroundColor: colors.divider,
    },
    contentStyle: {
      width: maxWidth,
      maxWidth: maxWidth,
      backgroundColor: colors.background,
    },
  };
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
  },
  desktopOuter: {
    flex: 1,
    alignItems: 'center',
  },
  desktopBackground: {
    backgroundColor: colors.divider,
  },
  desktopContent: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
  },
});
