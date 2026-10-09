import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { Ionicons, getGlyph } from './Ionicons';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
afterEach(() => container?.remove());

function render(element: React.ReactElement) {
  container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  return container;
}

describe('Ionicons', () => {
  it('maps names to their font code points', () => {
    expect(getGlyph('home')).toBe(String.fromCodePoint(Ionicons.glyphMap.home));
    expect(getGlyph('not-a-real-icon')).toBe('?');
  });

  it('renders the glyph in the Ionicons font with size and color', () => {
    const el = render(<Ionicons name="home" size={20} color="rgb(255, 0, 0)" />);
    const text = el.querySelector('div,span') as HTMLElement;
    expect(text.textContent).toBe(getGlyph('home'));
    const style = getComputedStyle(text);
    expect(style.fontFamily).toContain('Ionicons');
    expect(style.fontSize).toBe('20px');
    expect(style.color).toBe('rgb(255, 0, 0)');
  });

  // Same precedence as react-native-vector-icons: callers can't clobber the
  // icon font (e.g. via the app-wide Karla default).
  it('keeps the icon font even when the caller style sets fontFamily', () => {
    const el = render(<Ionicons name="home" style={{ fontFamily: 'Karla-Regular' }} />);
    const text = el.querySelector('div,span') as HTMLElement;
    expect(getComputedStyle(text).fontFamily).toContain('Ionicons');
  });
});
