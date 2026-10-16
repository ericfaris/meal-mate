import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
// Import through the alias, exactly as app code does.
import { Text, TextInput, View } from 'react-native';
import { FONT_BODY, FONT_DISPLAY, typeDefaults } from './reactNative';
import { typography } from '../theme';
import { Ionicons } from '../components/icons/Ionicons';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
afterEach(() => container?.remove());

function render(element: React.ReactElement) {
  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => createRoot(container).render(element));
  return container;
}

const fontOf = (el: Element | null) => getComputedStyle(el as HTMLElement).fontFamily;
const byText = (root: HTMLElement, text: string) =>
  [...root.querySelectorAll('*')].find((e) => e.firstChild?.nodeType === 3 && e.firstChild.textContent === text) as HTMLElement;

describe('react-native platform shim', () => {
  it('is what the bare react-native import resolves to', () => {
    expect(typeof View).not.toBe('undefined');
    const el = render(<Text>hello</Text>);
    expect(fontOf(byText(el, 'hello'))).toContain('Karla');
  });

  // Regression: App.tsx used Text.defaultProps, which React 19 ignores, so the
  // whole app silently rendered in the system font.
  it('gives body-sized text the body face', () => {
    const el = render(<Text style={{ fontSize: 16 }}>body</Text>);
    expect(fontOf(byText(el, 'body'))).toContain('Karla');
  });

  it('gives display-sized text the display face and eases bold to 600', () => {
    const el = render(<Text style={{ fontSize: 28, fontWeight: 'bold' }}>Title</Text>);
    const node = byText(el, 'Title');
    expect(fontOf(node)).toContain('Fraunces');
    expect(getComputedStyle(node).fontWeight).toBe('600');
  });

  it('never overrides an explicit fontFamily', () => {
    const el = render(<Text style={{ fontSize: 28, fontFamily: 'monospace' }}>code</Text>);
    expect(fontOf(byText(el, 'code'))).toMatch(/^monospace/);
  });

  it('lets nested text inherit the parent face unless it sets its own size', () => {
    const el = render(
      <Text style={{ fontSize: 28 }}>
        Good <Text style={{ color: 'red' }}>morning</Text> <Text style={{ fontSize: 14 }}>small</Text>
      </Text>
    );
    expect(fontOf(byText(el, 'morning'))).not.toContain('Karla');
    expect(fontOf(byText(el, 'small'))).toContain('Karla');
  });

  it('keeps the Ionicons font on icons', () => {
    const el = render(<Ionicons name="home" size={24} />);
    expect(fontOf(el.querySelector('div,span'))).toContain('Ionicons');
  });

  it('gives TextInput the body face', () => {
    const el = render(<TextInput value="x" onChangeText={() => {}} />);
    expect(fontOf(el.querySelector('input'))).toContain('Karla');
  });

  it('agrees with the theme font stacks', () => {
    expect(typography.families.body).toBe(FONT_BODY);
    expect(typography.families.display).toBe(FONT_DISPLAY);
  });

  it('treats the size threshold as inclusive and defaults unsized text to body', () => {
    expect(typeDefaults({ fontSize: 20 }, false).base).toEqual({ fontFamily: FONT_DISPLAY });
    expect(typeDefaults({ fontSize: 19 }, false).base).toEqual({ fontFamily: FONT_BODY });
    expect(typeDefaults(undefined, false).base).toEqual({ fontFamily: FONT_BODY });
    expect(typeDefaults([{ fontSize: 24 }, { fontWeight: '700' }], false).override).toEqual({ fontWeight: '600' });
    expect(typeDefaults({ fontSize: 24, fontWeight: '500' }, false).override).toBeUndefined();
  });
});
