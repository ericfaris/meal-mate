// Auth persistence in the browser's localStorage. Keys match what the previous
// AsyncStorage web implementation wrote, so existing sessions survive.
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: string;
  householdId?: string;
  profilePicture?: string;
  authProvider?: 'local' | 'google' | 'apple';
}

/**
 * Get authentication token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Save authentication token
 */
export const setToken = async (token: string): Promise<void> => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting token:', error);
    throw error;
  }
};

/**
 * Remove authentication token
 */
export const removeToken = async (): Promise<void> => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

/**
 * Get stored user data
 */
export const getUser = async (): Promise<StoredUser | null> => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Save user data
 */
export const setUser = async (user: StoredUser): Promise<void> => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error setting user:', error);
    throw error;
  }
};

/**
 * Remove user data
 */
export const removeUser = async (): Promise<void> => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error removing user:', error);
  }
};

/**
 * Clear all auth data (token and user)
 */
export const clearAuth = async (): Promise<void> => {
  await Promise.all([removeToken(), removeUser()]);
};
