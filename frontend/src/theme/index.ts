/**
 * Meal Mate — Design System
 *
 * Direction: "Farmhouse Kitchen" — a warm, cookbook-inspired identity for a
 * household meal-planning app. See /DESIGN.md at the repo root for the full
 * narrative, rationale, and component specs. This file is the single source
 * of truth for tokens; the static showcase at
 * frontend/public/design-system.html mirrors these values via
 * frontend/public/design-tokens.css — update both together (see DESIGN.md
 * "Keeping tokens in sync").
 */

export const colors = {
  // Primary palette
  background: '#FDFAF6',      // Warm cream (parchment paper)
  primary: '#B14E33',         // Deep terracotta (buttons, accents) — 5.2:1 contrast with white text (WCAG AA)
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

  // Accessibility
  focusRing: '#B14E33',       // Visible focus outline — same hue as primary, used at full opacity with a 2px offset ring (web) so it never reads as a stray shadow
};

export const typography = {
  // Two faces: Fraunces (display) carries the identity on hero/wordmark
  // moments; Karla (body) is the workhorse for everything else. Both are
  // self-hosted — see families.files below. Only the Regular (400) static
  // instance of each is bundled (both ship as variable fonts upstream);
  // weight hierarchy elsewhere still uses `weights.*` and degrades
  // gracefully to synthetic/system bolding where a platform doesn't apply
  // it to a custom font. See DESIGN.md "Type" for the full rationale.
  families: {
    display: 'Fraunces-Regular',   // registered name passed to useFonts()
    body: 'Karla-Regular',
    // Files loaded via expo-font in App.tsx; also self-hosted as .woff2
    // under frontend/public/fonts/ for the web PWA + showcase page.
    files: {
      display: '../assets/fonts/Fraunces-Regular.ttf',
      body: '../assets/fonts/Karla-Regular.ttf',
    },
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  // Full type scale. Each step names its face, size, line-height and
  // letter-spacing so any screen can spread `typography.scale.h1` directly
  // instead of assembling fontSize/lineHeight by hand.
  scale: {
    display: {
      fontFamily: 'Fraunces-Regular',
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: 0.2,
      usage: 'App wordmark, splash tagline, big hero moments only — not for screen titles.',
    },
    h1: {
      fontFamily: 'Fraunces-Regular',
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: 0,
      usage: 'Screen titles, day names.',
    },
    h2: {
      fontFamily: 'Karla-Regular',
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: 0,
      usage: 'Section headers.',
    },
    h3: {
      fontFamily: 'Karla-Regular',
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: 0,
      usage: 'Recipe titles, card headers.',
    },
    body: {
      fontFamily: 'Karla-Regular',
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      usage: 'Default body copy.',
    },
    small: {
      fontFamily: 'Karla-Regular',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
      usage: 'Tags, microcopy, form labels.',
    },
    tiny: {
      fontFamily: 'Karla-Regular',
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.2,
      usage: 'Timestamps, hints, legal/footer text.',
    },
  },
  // Legacy flat map kept for existing screens (`typography.sizes.h1`, etc.)
  // — do not remove; ~30 screens read from this today. New code should
  // prefer `typography.scale.*` above, which additionally carries the
  // font family, line-height and letter-spacing for each step.
  sizes: {
    h1: 28,
    h2: 24,
    h3: 20,
    body: 16,
    small: 14,
    tiny: 12,
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

// Named motion tokens: duration + easing curve, and which kind of
// transition each pairing is meant for. RN's `Easing.bezier(x1,y1,x2,y2)`
// takes the same 4 numbers as a CSS cubic-bezier — the showcase page's CSS
// `transition-timing-function` uses the literal cubic-bezier() form so the
// feel can be checked in a browser without a device.
export const motion = {
  microInteraction: {
    duration: animations.fast,       // 150ms
    easing: [0.4, 0, 0.2, 1],        // "standard" ease — quick settle, no overshoot
    cubicBezier: 'cubic-bezier(0.4, 0, 0.2, 1)',
    usage: 'Button press, checkbox toggle, tab switch — anything under the finger.',
  },
  reveal: {
    duration: animations.normal,     // 300ms
    easing: [0.16, 1, 0.3, 1],       // "ease-out-expo"-ish — fast start, gentle landing
    cubicBezier: 'cubic-bezier(0.16, 1, 0.3, 1)',
    usage: 'Modal/card entrances, list item stagger, screen-level reveals.',
  },
  emphasis: {
    duration: animations.slow,       // 500ms
    easing: [0.34, 1.56, 0.64, 1],   // gentle spring overshoot
    cubicBezier: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    usage: 'Success celebrations (plan confirmed, recipe saved) — the one place a little bounce is earned.',
  },
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
  motion,
};

export default theme;
