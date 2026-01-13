// API base URL - auto-detect web vs mobile
// Web: use localhost, Mobile: use WiFi IP (192.168.0.111)
import { Platform } from 'react-native';
import axios, { AxiosInstance } from 'axios';
import { getToken, clearAuth } from '../services/storage';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }
  // For mobile devices (iOS/Android) on same WiFi network
  return 'http://192.168.0.111:3001';
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
      // The AuthContext will detect the missing token and redirect to login
    }
    return Promise.reject(error);
  }
);
