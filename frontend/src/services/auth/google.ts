import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AuthSessionResult } from 'expo-auth-session';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { setToken, setUser, StoredUser } from '../storage';

// Ensure browser session is completed on web
WebBrowser.maybeCompleteAuthSession();

export interface GoogleConfig {
  webClientId: string;
  iosClientId?: string;
  androidClientId?: string;
}

export interface GoogleAuthResponse {
  message: string;
  token: string;
  user: StoredUser;
}

/**
 * Fetch Google OAuth configuration from backend
 */
export async function getGoogleConfig(): Promise<GoogleConfig | null> {
  try {
    const response = await axios.get(`${API_ENDPOINTS.auth}/google/config`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch Google config:', error);
    return null;
  }
}

/**
 * Create Google auth request hook configuration
 */
export function useGoogleAuthConfig(config: GoogleConfig | null) {
  return Google.useAuthRequest({
    webClientId: config?.webClientId,
    iosClientId: config?.iosClientId,
    androidClientId: config?.androidClientId,
    scopes: ['profile', 'email'],
  });
}

/**
 * Exchange Google auth response for backend JWT
 * Supports both ID token (preferred) and access token (fallback for web)
 */
export async function authenticateWithGoogle(
  idToken?: string,
  accessToken?: string
): Promise<GoogleAuthResponse> {
  if (!idToken && !accessToken) {
    throw new Error('Either ID token or access token is required');
  }

  try {
    const response = await axios.post(`${API_ENDPOINTS.auth}/google`, {
      idToken,
      accessToken,
    });

    const { token, user } = response.data;

    // Store token and user
    await setToken(token);
    await setUser(user);

    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || 'Google authentication failed';
    throw new Error(message);
  }
}

/**
 * Handle the full Google Sign-In flow
 * Returns true if successful, throws error otherwise
 *
 * On web, the OAuth flow may only return an access token (no ID token),
 * so we support both authentication methods.
 */
export async function handleGoogleSignIn(
  response: AuthSessionResult
): Promise<GoogleAuthResponse | null> {
  if (response.type !== 'success') {
    if (response.type === 'cancel') {
      return null; // User cancelled, not an error
    }
    throw new Error('Google Sign-In failed');
  }

  const { authentication } = response;

  // Check if we have at least one token
  if (!authentication?.idToken && !authentication?.accessToken) {
    throw new Error('No authentication token received from Google');
  }

  // Send both tokens to backend - it will prefer ID token but fall back to access token
  return authenticateWithGoogle(
    authentication.idToken || undefined,
    authentication.accessToken || undefined
  );
}
