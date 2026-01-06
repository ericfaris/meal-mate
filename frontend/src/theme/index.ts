/**
 * Dinner Planner App - Design System
 * Warm kitchen-inspired palette with friendly, inviting aesthetics
 */

export const colors = {
  // Primary palette
  background: '#FDFAF6',      // Warm cream (parchment paper)
  primary: '#E8A798',         // Muted terracotta (buttons, accents)
  primaryLight: '#FDF5F3',    // Light terracotta tint
  secondary: '#A8B5A2',       // Soft sage (tags, highlights)
  secondaryLight: '#F3F6F2',  // Light sage tint
  success: '#A7D8A8',         // Gentle mint (confirmed plans)

  // Text colors
  text: '#2D2D2D',            // Dark gray (high contrast)
  textLight: '#666666',       // Secondary text
  textMuted: '#999999',       // Tertiary text
  textOnPrimary: '#FFFFFF',   // Text on terracotta buttons

  // UI colors
  white: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E5E5E5',
  divider: '#F0F0F0',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Status colors
  statusGray: '#6B7280',      // Muted gray (eat out days)
  error: '#E57373',           // Soft red for errors
  warning: '#FFB74D',         // Soft orange for warnings

  // Tag colors (for complexity badges)
  tagSimple: '#C8E6C9',       // Light green
  tagMedium: '#FFE0B2',       // Light orange
  tagComplex: '#FFCDD2',      // Light red
};

export const typography = {
  sizes: {
    h1: 28,        // Day names, screen titles
    h2: 24,        // Section headers
    h3: 20,        // Recipe titles
    body: 16,      // Body text
    small: 14,     // Tags, microcopy
    tiny: 12,      // Timestamps, hints
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  families: {
    default: undefined, // Use system default
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Common component heights
export const heights = {
  button: 48,
  buttonSmall: 36,
  input: 48,
  chip: 32,
  tabBar: 60,
  header: 56,
};

// Animation durations (in ms)
export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Default theme export
const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  heights,
  animations,
};

export default theme;
