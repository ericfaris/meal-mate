/**
 * Responsive Design Utilities
 *
 * Provides hooks and utilities for responsive layouts across
 * mobile, tablet, and desktop/web screens.
 */

import { useState, useEffect } from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

// Breakpoints for responsive design
export const breakpoints = {
  mobile: 0,      // 0-767px (phones)
  tablet: 768,    // 768-1023px (tablets)
  desktop: 1024,  // 1024px+ (desktop/web)
  wide: 1440,     // 1440px+ (wide desktop)
};

// Maximum content width for readability on large screens
export const maxContentWidth = {
  narrow: 480,    // For forms, modals
  default: 720,   // For content screens
  wide: 960,      // For grid layouts
  full: 1200,     // For full-width content
};

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveState {
  width: number;
  height: number;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWeb: boolean;
  isLandscape: boolean;
  // Grid columns for responsive layouts
  gridColumns: number;
  // Content padding based on screen size
  horizontalPadding: number;
}

const getDeviceType = (width: number): DeviceType => {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
};

const getGridColumns = (deviceType: DeviceType): number => {
  switch (deviceType) {
    case 'desktop': return 3;
    case 'tablet': return 2;
    default: return 1;
  }
};

const getHorizontalPadding = (deviceType: DeviceType): number => {
  switch (deviceType) {
    case 'desktop': return 48;
    case 'tablet': return 32;
    default: return 16;
  }
};

const calculateResponsiveState = (dimensions: ScaledSize): ResponsiveState => {
  const { width, height } = dimensions;
  const deviceType = getDeviceType(width);

  return {
    width,
    height,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isWeb: Platform.OS === 'web',
    isLandscape: width > height,
    gridColumns: getGridColumns(deviceType),
    horizontalPadding: getHorizontalPadding(deviceType),
  };
};

/**
 * Hook that provides responsive layout information
 * Updates when window dimensions change (for web resize, device rotation)
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() =>
    calculateResponsiveState(Dimensions.get('window'))
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setState(calculateResponsiveState(window));
    });

    return () => subscription?.remove();
  }, []);

  return state;
}

/**
 * Get current responsive state without subscribing to changes
 * Use for static calculations, prefer useResponsive() for components
 */
export function getResponsiveState(): ResponsiveState {
  return calculateResponsiveState(Dimensions.get('window'));
}

/**
 * Calculate content width with max constraint for large screens
 * Centers content and limits width for readability
 */
export function getContentWidth(
  screenWidth: number,
  maxWidth: number = maxContentWidth.default
): { width: number | '100%'; marginHorizontal: number | 'auto' } {
  if (screenWidth > maxWidth + 48) {
    return {
      width: maxWidth,
      marginHorizontal: 'auto',
    };
  }
  return {
    width: '100%',
    marginHorizontal: 0,
  };
}

/**
 * Calculate the width of items in a grid based on screen width and column count
 */
export function getGridItemWidth(
  screenWidth: number,
  columns: number,
  gap: number = 16,
  horizontalPadding: number = 16
): number {
  const availableWidth = screenWidth - (horizontalPadding * 2);
  const totalGapWidth = gap * (columns - 1);
  return (availableWidth - totalGapWidth) / columns;
}

export default useResponsive;
