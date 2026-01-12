import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { setToken, setUser, StoredUser } from '../storage';

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
 * Configure Google Sign-In with client IDs
 */
export function configureGoogleSignIn(config: GoogleConfig): void {
  console.log('[Google] Configuring with:', {
    webClientId: config.webClientId?.substring(0, 20) + '...',
    hasIosClientId: !!config.iosClientId,
    hasAndroidClientId: !!config.androidClientId,
  });

  // Note: androidClientId was removed in library v7.2.2+
  // Android authentication is handled via SHA-1 fingerprint + webClientId
  GoogleSignin.configure({
    webClientId: config.webClientId, // Required for idToken
    iosClientId: config.iosClientId, // Optional, can be auto-detected
    offlineAccess: true,
    scopes: ['profile', 'email'],
  });

  console.log('[Google] Configuration complete');
}

/**
 * Exchange Google ID token for backend JWT
 */
export async function authenticateWithGoogle(
  idToken: string
): Promise<GoogleAuthResponse> {
  try {
    const response = await axios.post(`${API_ENDPOINTS.auth}/google`, {
      idToken,
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
 * Handle the full Google Sign-In flow using the new library
 */
export async function handleGoogleSignIn(): Promise<GoogleAuthResponse> {
  try {
    console.log('[Google] Checking Play Services...');
    // Check if Google Play Services are available (Android)
    await GoogleSignin.hasPlayServices();
    console.log('[Google] Play Services available');

    console.log('[Google] Starting sign-in...');
    // Sign in and get user info
    const response = await GoogleSignin.signIn();
    console.log('[Google] Sign-in response:', JSON.stringify(response, null, 2));

    // Extract ID token from response
    // Response structure: { type: 'success', data: { idToken, serverAuthCode, scopes, user } }
    const idToken = (response as any).data?.idToken;

    console.log('[Google] ID Token present:', !!idToken);

    if (!idToken) {
      console.error('[Google] Full response object:', response);
      throw new Error('No ID token received from Google');
    }

    console.log('[Google] Authenticating with backend...');
    // Authenticate with backend
    return await authenticateWithGoogle(idToken);
  } catch (error: any) {
    console.error('[Google] Sign-In error:', error);
    console.error('[Google] Error code:', error.code);
    console.error('[Google] Error message:', error.message);

    // Handle specific error cases
    if (error.code === 'SIGN_IN_CANCELLED') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign-in already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services not available');
    }

    throw new Error(error.message || 'Google Sign-In failed');
  }
}

/**
 * Sign out from Google
 */
export async function signOutFromGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Google sign-out error:', error);
  }
}
