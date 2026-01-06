import axios from 'axios';
import { API_ENDPOINTS, apiClient } from '../../config/api';
import { setToken, setUser, clearAuth, StoredUser, getToken } from '../storage';

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
    const response = await axios.post(`${API_ENDPOINTS.auth}/login`, credentials);
    const { token, user } = response.data;

    // Store token and user
    await setToken(token);
    await setUser(user);

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Login failed');
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
 * Logout - clear stored auth data
 */
export const logout = async (): Promise<void> => {
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
