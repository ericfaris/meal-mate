import axios from 'axios';
import { API_ENDPOINTS, apiClient } from '../../config/api';
import { setToken, setUser, clearAuth, StoredUser, getToken } from '../storage';
import { signOutFromGoogle } from './google';

export interface AuthResponse {
  message: string;
  token: string;
  user: StoredUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
}

/**
 * Login with email and password
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    console.log('[Auth] Attempting login to:', `${API_ENDPOINTS.auth}/login`);
    const response = await axios.post(`${API_ENDPOINTS.auth}/login`, credentials);
    console.log('[Auth] Login successful');
    const { token, user } = response.data;

    // Store token and user
    await setToken(token);
    await setUser(user);

    return response.data;
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    console.error('[Auth] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      code: error.code,
    });

    // Provide more specific error messages
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Connection timeout - please check your network connection');
    }
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      throw new Error('Network error - cannot reach server at ' + API_ENDPOINTS.auth);
    }

    throw new Error(error.response?.data?.error || error.message || 'Login failed');
  }
};

/**
 * Register new account
 */
export const signup = async (credentials: SignupCredentials): Promise<AuthResponse> => {
  try {
    const response = await axios.post(`${API_ENDPOINTS.auth}/register`, credentials);
    const { token, user } = response.data;

    // Store token and user
    await setToken(token);
    await setUser(user);

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Signup failed');
  }
};

/**
 * Logout - clear stored auth data and sign out from Google
 */
export const logout = async (): Promise<void> => {
  // Sign out from Google if user was signed in via Google
  await signOutFromGoogle();

  // Clear local auth data
  await clearAuth();
};

/**
 * Get current user from server
 */
export const getCurrentUser = async (): Promise<StoredUser | null> => {
  try {
    const token = await getToken();
    if (!token) {
      return null;
    }

    const response = await apiClient.get(`${API_ENDPOINTS.auth}/me`);
    return response.data.user;
  } catch (error) {
    return null;
  }
};

/**
 * Refresh auth token
 */
export const refreshToken = async (): Promise<string | null> => {
  try {
    const response = await apiClient.post(`${API_ENDPOINTS.auth}/refresh`);
    const { token, user } = response.data;

    await setToken(token);
    await setUser(user);

    return token;
  } catch (error) {
    await clearAuth();
    return null;
  }
};
