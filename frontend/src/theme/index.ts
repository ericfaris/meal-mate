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
  // Primary palette (v1.1 "landing" retune — matches the marketing page at
  // /welcome/; see DESIGN.md changelog)
  background: '#FDFAF6',      // Warm cream (parchment paper) — the page ground
  primary: '#B14E33',         // Deep terracotta — CTAs, active states, today. 5.2:1 with white text (WCAG AA)
  primaryLight: '#FBEDE8',    // Terracotta wash — selected chips, skipped days
  secondary: '#7E9277',       // Sage — leaf/vegetarian marks, toggles, progress (3.6:1 on cream: icons/large only)
  secondaryLight: '#EEF2EC',  // Sage wash — household/info bands
  success: '#A7D8A8',         // Gentle mint (confirmed plans)
  linen: '#F6EFE6',           // Linen — recessed bands, image placeholders, inactive day pills

  // Text colors (warm greys biased toward the terracotta, not neutral grey)
  text: '#2D2D2D',            // Ink — 13.6:1 on cream
  textLight: '#5E5A55',       // Secondary text — 6.6:1 on cream
  textMuted: '#857D76',       // Tertiary text, timestamps — 4.0:1 on cream
  textOnPrimary: '#FFFFFF',   // Text on terracotta buttons

  // UI colors
  white: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E8DFD4',          // Warm hairline — card and input outlines
  divider: '#F1EAE1',
  overlay: 'rgba(45, 30, 20, 0.5)',

  // Status colors
  statusGray: '#7A726B',      // Muted warm gray (eat out days)
  error: '#C8553D',           // Brick red for errors (distinct from primary by context + icon)
  warning: '#E0A04A',         // Honey for warnings

  // Tag colors (for complexity badges) — softened to sit on cream
  tagSimple: '#DCEFD9',       // Light green
  tagMedium: '#FCE9CC',       // Light apricot
  tagComplex: '#F9D9D6',      // Light rose

  // Accessibility
  focusRing: '#B14E33',       // Visible focus outline — same hue as primary, used at full opacity with a 2px offset ring (web) so it never reads as a stray shadow
};

export const typography = {
  // Two faces, both self-hosted variable fonts (latin subset) loaded via
  // @font-face in index.html: Fraunces (display: headings, dates, numerals,
  // italic accents) and Karla (body: everything else). The `react-native`
  // platform shim (src/platform/reactNative.tsx) applies them automatically —
  // Karla by default, Fraunces at fontSize >= 20 — so screens rarely need to
  // set fontFamily. Use `families.*` explicitly for display moments below 20px
  // (day numbers, card titles) or the italic accent. See DESIGN.md "Type".
  families: {
    display: 'Fraunces, Georgia, "Times New Roman", serif',
    body: 'Karla, -apple-system, "Segoe UI", Roboto, sans-serif',
    files: {
      display: '/fonts/Fraunces-Variable.woff2',
      displayItalic: '/fonts/Fraunces-Italic-Variable.woff2',
      body: '/fonts/Karla-Variable.woff2',
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
      fontFamily: 'Fraunces',
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: -0.3,
      usage: 'App wordmark, splash tagline, hero greetings only — not for screen titles.',
    },
    h1: {
      fontFamily: 'Fraunces',
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.2,
      usage: 'Screen titles, recipe titles on detail.',
    },
    h2: {
      fontFamily: 'Fraunces',
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.1,
      usage: 'Section headers.',
    },
    h3: {
      fontFamily: 'Fraunces',
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: 0,
      usage: 'Card headers, header bar titles.',
    },
    body: {
      fontFamily: 'Karla',
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      usage: 'Default body copy.',
    },
    small: {
      fontFamily: 'Karla',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
      usage: 'Tags, microcopy, form labels.',
    },
    tiny: {
      fontFamily: 'Karla',
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.2,
      usage: 'Timestamps, hints, legal/footer text.',
    },
    eyebrow: {
      fontFamily: 'Karla',
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 1.4,
      usage: 'UPPERCASE bold terracotta label above a section or a store aisle (spread `eyebrow` below).',
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

// Warm-tinted shadows (brown, not black) kept soft: on cream the 1px
// `colors.border` outline does most of the separating; shadow only lifts.
export const shadows = {
  card: {
    shadowColor: '#3C2819',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  button: {
    shadowColor: '#3C2819',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  floating: {
    shadowColor: '#3C2819',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
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

// Ready-made style fragments for the landing-page look. Spread them into
// StyleSheet entries: `title: { ...eyebrow }`, `card: { ...surface }`.
export const eyebrow = {
  fontFamily: typography.families.body,
  fontSize: 12,
  lineHeight: 16,
  letterSpacing: 1.4,
  fontWeight: '700' as const,
  textTransform: 'uppercase' as const,
  color: colors.primary,
};

export const surface = {
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 16,
  ...shadows.card,
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
  eyebrow,
  surface,
};

export default theme;
