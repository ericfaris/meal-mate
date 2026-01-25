// API base URL configuration
// Development: localhost (web) or WiFi IP (mobile)
// Production: set EXPO_PUBLIC_API_URL in EAS secrets
import { Platform } from 'react-native';
import axios, { AxiosInstance } from 'axios';
import { getToken, clearAuth } from '../services/storage';

// Callback for when auth expires - set by AuthContext
let authExpiredCallback: (() => void) | null = null;

export const setAuthExpiredCallback = (callback: (() => void) | null) => {
  authExpiredCallback = callback;
};

// Development URLs
const DEV_WEB_URL = 'http://localhost:3001';
const DEV_MOBILE_URL = 'http://192.168.0.111:3001';

const getApiUrl = () => {
  // Production: use EXPO_PUBLIC_API_URL environment variable
  if (!__DEV__ && process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Development: web uses localhost, mobile uses WiFi IP
  if (Platform.OS === 'web') {
    return DEV_WEB_URL;
  }
  return DEV_MOBILE_URL;
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  recipes: `${API_BASE_URL}/api/recipes`,
  recipeImport: `${API_BASE_URL}/api/recipes/import`,
  plans: `${API_BASE_URL}/api/plans`,
  suggestions: `${API_BASE_URL}/api/suggestions`,
  auth: `${API_BASE_URL}/api/auth`,
  households: `${API_BASE_URL}/api/household`,
  submissions: `${API_BASE_URL}/api/submissions`,
  health: `${API_BASE_URL}/health`,
};

// Create axios instance with interceptors
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      await clearAuth();
      // Notify AuthContext to update state and redirect to login
      if (authExpiredCallback) {
        authExpiredCallback();
      }
    }
    return Promise.reject(error);
  }
);
