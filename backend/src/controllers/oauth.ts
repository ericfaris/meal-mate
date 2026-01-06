import { Request, Response } from 'express';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import axios from 'axios';
import User, { IUser } from '../models/user';
import { oauthConfig } from '../config/oauth';

// Initialize Google OAuth client
const googleClient = new OAuth2Client();

// Google userinfo endpoint
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// Valid Google client IDs for token verification
const getValidClientIds = (): string[] => {
  return [
    oauthConfig.google.clientId,
    oauthConfig.google.webClientId,
    oauthConfig.google.iosClientId,
    oauthConfig.google.androidClientId,
  ].filter(Boolean);
};

interface GoogleAuthRequest {
  idToken?: string;
  accessToken?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/**
 * Fetch user info from Google using access token
 * Used when ID token is not available (e.g., web OAuth flow)
 */
async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const response = await axios.get<GoogleUserInfo>(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch Google user info:', error);
    return null;
  }
}

/**
 * Verify Google ID token and return payload
 */
async function verifyGoogleToken(idToken: string): Promise<TokenPayload | null> {
  try {
    const validClientIds = getValidClientIds();

    if (validClientIds.length === 0) {
      console.error('No Google client IDs configured');
      return null;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: validClientIds,
    });

    return ticket.getPayload() || null;
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}

/**
 * Find or create user from Google profile
 */
async function findOrCreateGoogleUser(payload: TokenPayload): Promise<IUser> {
  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email) {
    throw new Error('Email not provided by Google');
  }

  // First, try to find user by Google provider ID
  let user = await User.findOne({
    authProvider: 'google',
    providerId: googleId,
  });

  if (user) {
    // Update last login and profile picture if changed
    user.lastLoginAt = new Date();
    if (picture && user.profilePicture !== picture) {
      user.profilePicture = picture;
    }
    await user.save();
    return user;
  }

  // Check if user exists with same email (local account)
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    // Link Google account to existing user if they used local auth
    if (existingUser.authProvider === 'local') {
      existingUser.authProvider = 'google';
      existingUser.providerId = googleId;
      existingUser.emailVerified = email_verified || false;
      existingUser.profilePicture = picture;
      existingUser.lastLoginAt = new Date();
      await existingUser.save();
      return existingUser;
    }
    // If already linked to different OAuth provider, throw error
    throw new Error('Email already registered with different provider');
  }

  // Create new user
  user = new User({
    email: email.toLowerCase(),
    name: name || email.split('@')[0],
    authProvider: 'google',
    providerId: googleId,
    emailVerified: email_verified || false,
    profilePicture: picture,
    role: 'member',
    lastLoginAt: new Date(),
  });

  await user.save();
  return user;
}

/**
 * POST /api/auth/google - Authenticate with Google ID token or access token
 *
 * This endpoint receives a Google ID token (preferred) or access token from the frontend,
 * verifies it, and returns a JWT for the application.
 *
 * On web, the OAuth flow may only return an access token, so we support both methods.
 */
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, accessToken } = req.body as GoogleAuthRequest;

    if (!idToken && !accessToken) {
      res.status(400).json({ error: 'Google ID token or access token is required' });
      return;
    }

    let userInfo: TokenPayload | GoogleUserInfo | null = null;

    // Try ID token first (more secure, contains verified claims)
    if (idToken) {
      userInfo = await verifyGoogleToken(idToken);
    }

    // Fall back to access token if ID token not provided or verification failed
    if (!userInfo && accessToken) {
      console.log('Using access token to fetch user info');
      userInfo = await fetchGoogleUserInfo(accessToken);
    }

    if (!userInfo) {
      res.status(401).json({ error: 'Invalid Google token' });
      return;
    }

    // Find or create user
    const user = await findOrCreateGoogleUser(userInfo as TokenPayload);

    // Store OAuth tokens if provided (for future API calls to Google)
    if (accessToken) {
      await user.updateOAuthTokens({
        accessToken,
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour default
      });
    }

    // Generate application JWT
    const token = user.generateAuthToken();

    res.json({
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        householdId: user.householdId,
        profilePicture: user.profilePicture,
        authProvider: user.authProvider,
      },
    });
  } catch (error: any) {
    console.error('Google auth error:', error);

    if (error.message === 'Email already registered with different provider') {
      res.status(409).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Google authentication failed' });
  }
};

/**
 * POST /api/auth/logout - Logout user
 *
 * For JWT-based auth, logout is primarily client-side.
 * This endpoint can be used to revoke OAuth tokens if needed.
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (user && user.oauthTokens) {
      // Clear OAuth tokens from database
      user.oauthTokens = undefined;
      await user.save();
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * GET /api/auth/google/config - Get Google OAuth client configuration
 *
 * Returns the client IDs needed for frontend Google Sign-In setup.
 * Does not expose secrets.
 */
export const getGoogleConfig = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    webClientId: oauthConfig.google.webClientId || oauthConfig.google.clientId,
    iosClientId: oauthConfig.google.iosClientId,
    androidClientId: oauthConfig.google.androidClientId,
  });
};
