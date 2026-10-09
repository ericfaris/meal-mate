import { describe, expect, it } from 'vitest';
import { resolveApiUrl } from './api';

describe('resolveApiUrl', () => {
  it('uses the local backend in development', () => {
    expect(resolveApiUrl(true, 'https://example.com')).toBe('http://localhost:3001');
  });

  it('uses the configured URL in production', () => {
    expect(resolveApiUrl(false, 'https://api.example.com')).toBe('https://api.example.com');
  });

  // A production build must never fall back to the dev server.
  it('falls back to the production API when unconfigured', () => {
    expect(resolveApiUrl(false, undefined)).toBe('https://mealmate-api.mooseflip.com');
    expect(resolveApiUrl(false, '')).toBe('https://mealmate-api.mooseflip.com');
  });
});
