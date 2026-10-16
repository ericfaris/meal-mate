import { describe, expect, it } from 'vitest';
import { shouldRedirectToWelcome, WELCOME_SEEN_KEY } from './welcome';

const memory = (init: Record<string, string> = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

describe('shouldRedirectToWelcome', () => {
  it('sends a first-time signed-out visitor at / to the landing page', () => {
    expect(shouldRedirectToWelcome({ pathname: '/', search: '', storage: memory() })).toBe(true);
  });

  it('never redirects signed-in users', () => {
    expect(shouldRedirectToWelcome({ pathname: '/', search: '', storage: memory({ auth_token: 'jwt' }) })).toBe(false);
  });

  it('only redirects once', () => {
    expect(shouldRedirectToWelcome({ pathname: '/', search: '', storage: memory({ [WELCOME_SEEN_KEY]: '1' }) })).toBe(false);
  });

  // Invite links must reach the app, signed in or not.
  it('leaves deep links alone', () => {
    expect(shouldRedirectToWelcome({ pathname: '/join/abc', search: '', storage: memory() })).toBe(false);
    expect(shouldRedirectToWelcome({ pathname: '/grocery/1', search: '', storage: memory() })).toBe(false);
  });

  it('treats ?start (the landing page buttons) as seen', () => {
    const s = memory();
    expect(shouldRedirectToWelcome({ pathname: '/', search: '?start', storage: s })).toBe(false);
    expect(s.m.get(WELCOME_SEEN_KEY)).toBe('1');
  });

  it('does not redirect when storage is unavailable (would loop)', () => {
    expect(shouldRedirectToWelcome({ pathname: '/', search: '', storage: null })).toBe(false);
  });
});
