import { Platform } from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';
import { API_ENDPOINTS } from '../../config/api';
import { setToken, setUser, StoredUser } from '../storage';

// Dynamically import GoogleSignin to handle Expo Go where native modules aren't available
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (error) {
  console.log('[Google] Native module not available (likely running in Expo Go)');
}

// Check if running in Expo Go (no native modules)
const isExpoGo = Constants.appOwnership === 'expo';

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
  // Skip configuration in Expo Go - native module not available
  if (isExpoGo || !GoogleSignin) {
    console.log('[Google] Skipping configuration (Expo Go or native module unavailable)');
    return;
  }

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
 * Handle Google Sign-In on web using Google Identity Services
 * This function is called from the GoogleSignInButton component after the user
 * selects their account via the Google One Tap UI or button
 */
async function handleWebGoogleSignIn(credential: string): Promise<GoogleAuthResponse> {
  try {
    console.log('[Google Web] Received credential from Google, authenticating with backend...');
    return await authenticateWithGoogle(credential);
  } catch (error: any) {
    console.error('[Google Web] Sign-In error:', error);
    throw error;
  }
}

/**
 * Handle the full Google Sign-In flow (platform-specific)
 *
 * For web: This should be called with the credential from @react-oauth/google
 * For native: This triggers the native Google Sign-In flow
 */
export async function handleGoogleSignIn(credentialOrConfig?: string | GoogleConfig): Promise<GoogleAuthResponse> {
  // Web platform: credential is passed directly from @react-oauth/google
  if (Platform.OS === 'web') {
    if (typeof credentialOrConfig === 'string') {
      return await handleWebGoogleSignIn(credentialOrConfig);
    }
    throw new Error('Web platform requires credential from Google');
  }

  // Native platforms (Android/iOS): Use @react-native-google-signin/google-signin
  // Check if running in Expo Go - native module not available
  if (isExpoGo || !GoogleSignin) {
    throw new Error('Google Sign-In is not available in Expo Go. Please use email/password login or build a development client.');
  }

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
    // Only sign out on native platforms (GoogleSignin not available on web or Expo Go)
    if (Platform.OS !== 'web' && !isExpoGo && GoogleSignin) {
      await GoogleSignin.signOut();
    }
  } catch (error) {
    console.error('Google sign-out error:', error);
  }
}

/**
 * Check if Google Sign-In is available (not in Expo Go)
 */
export function isGoogleSignInAvailable(): boolean {
  return !isExpoGo && GoogleSignin !== null;
}
