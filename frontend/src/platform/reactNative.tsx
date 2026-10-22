/**
 * `react-native` as the app sees it: react-native-web, plus the design
 * system's type defaults on Text and TextInput.
 *
 * vite.config.mts aliases the bare `react-native` import to this module (app
 * code and libraries like React Navigation alike), so every Text in the app
 * gets the right face without per-screen edits:
 *   - body face (Karla) by default;
 *   - display face (Fraunces) when the text is display-sized (fontSize >= 20),
 *     with heavy weights eased to 600 so headings read like the landing page;
 *   - an explicit `fontFamily` (e.g. the Ionicons font) always wins.
 * Nested Text inherits its parent's face (as in React Native) unless it sets
 * its own fontSize. Replaces the old `Text.defaultProps` hack in App.tsx,
 * which React 19 silently ignores. See DESIGN.md "Type".
 */
import { createContext, forwardRef, useContext } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
} from 'react-native-web';

export * from 'react-native-web';

export const FONT_BODY = 'Karla, -apple-system, "Segoe UI", Roboto, sans-serif';
export const FONT_DISPLAY = 'Fraunces, Georgia, "Times New Roman", serif';
export const DISPLAY_MIN_SIZE = 20;

const HEAVY = new Set(['bold', '700', '800', '900', 700, 800, 900]);

type AnyStyle = Record<string, any> | undefined;

/** Style to put under (and, for weight, over) the caller's style. */
export function typeDefaults(style: unknown, nested: boolean): { base: AnyStyle; override: AnyStyle } {
  const flat = (StyleSheet.flatten(style as any) || {}) as Record<string, any>;
  if (flat.fontFamily) return { base: undefined, override: undefined };
  // Nested text with no size of its own inherits the parent's face.
  if (nested && flat.fontSize == null) return { base: undefined, override: undefined };
  const size = typeof flat.fontSize === 'number' ? flat.fontSize : 14;
  if (size >= DISPLAY_MIN_SIZE) {
    return {
      base: { fontFamily: FONT_DISPLAY },
      override: HEAVY.has(flat.fontWeight) ? { fontWeight: '600' } : undefined,
    };
  }
  return { base: { fontFamily: FONT_BODY }, override: undefined };
}

const InsideText = createContext(false);

export const Text = forwardRef<any, any>(function Text(props, ref) {
  const nested = useContext(InsideText);
  const { base, override } = typeDefaults(props.style, nested);
  const el = <RNText ref={ref} {...props} style={[base, props.style, override]} />;
  return nested ? el : <InsideText.Provider value>{el}</InsideText.Provider>;
}) as unknown as typeof RNText;

export const TextInput = forwardRef<any, any>(function TextInput(props, ref) {
  return <RNTextInput ref={ref} {...props} style={[{ fontFamily: FONT_BODY }, props.style]} />;
}) as unknown as typeof RNTextInput;
