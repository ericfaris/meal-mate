import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { setToken, setUser, StoredUser } from '../storage';

export interface GoogleConfig {
  webClientId: string;
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
 * Handle Google Sign-In: called by GoogleSignInButton with the credential
 * (ID token) that @react-oauth/google returns after the user picks an account.
 */
export async function handleGoogleSignIn(credential: string): Promise<GoogleAuthResponse> {
  try {
    console.log('[Google] Received credential from Google, authenticating with backend...');
    return await authenticateWithGoogle(credential);
  } catch (error: any) {
    console.error('[Google] Sign-In error:', error);
    throw error;
  }
}
