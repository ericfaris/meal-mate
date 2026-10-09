import { beforeEach, describe, expect, it } from 'vitest';
import { clearAuth, getToken, getUser, setToken, setUser, StoredUser } from './index';

const user: StoredUser = { id: 'u1', email: 'a@b.c', name: 'Ann', role: 'admin' };

describe('auth storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips the token and user', async () => {
    await setToken('jwt-123');
    await setUser(user);
    expect(await getToken()).toBe('jwt-123');
    expect(await getUser()).toEqual(user);
  });

  // Regression: the previous AsyncStorage web build wrote these exact keys;
  // changing them would log every existing PWA user out on deploy.
  it('reads sessions written under the legacy AsyncStorage keys', async () => {
    localStorage.setItem('auth_token', 'legacy-jwt');
    localStorage.setItem('user_data', JSON.stringify(user));
    expect(await getToken()).toBe('legacy-jwt');
    expect(await getUser()).toEqual(user);
  });

  it('clearAuth removes token and user', async () => {
    await setToken('jwt');
    await setUser(user);
    await clearAuth();
    expect(await getToken()).toBeNull();
    expect(await getUser()).toBeNull();
  });

  it('returns null for corrupt user data instead of throwing', async () => {
    localStorage.setItem('user_data', '{not json');
    expect(await getUser()).toBeNull();
  });
});
