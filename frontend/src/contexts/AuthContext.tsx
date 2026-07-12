import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getToken, getUser, clearAuth, StoredUser } from '../services/storage';
import * as authService from '../services/auth';
import { GoogleAuthResponse } from '../services/auth/google';
import { setAuthExpiredCallback } from '../config/api';

interface AuthContextType {
  user: StoredUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (response: GoogleAuthResponse) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const appState = useRef(AppState.currentState);

  // Handle auth expiration callback from axios interceptor
  const handleAuthExpired = useCallback(() => {
    console.log('[AuthContext] Auth expired, clearing user state');
    setUser(null);
  }, []);

  // Register the auth expired callback with the API client
  useEffect(() => {
    setAuthExpiredCallback(handleAuthExpired);
    return () => {
      setAuthExpiredCallback(null);
    };
  }, [handleAuthExpired]);

  // Listen for app state changes to re-validate auth when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // App is coming to foreground from background
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[AuthContext] App came to foreground, validating auth');
        await validateAuthOnResume();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Validate auth state when app resumes - check if token is still valid
  const validateAuthOnResume = async () => {
    try {
      const token = await getToken();
      if (!token) {
        // Token was cleared (possibly by interceptor while backgrounded)
        if (user) {
          console.log('[AuthContext] No token found on resume, clearing user');
          setUser(null);
        }
        return;
      }

      // Token exists, verify it's still valid by calling the server
      const serverUser = await authService.getCurrentUser();
      if (!serverUser) {
        // Token is invalid/expired
        console.log('[AuthContext] Token invalid on resume, clearing auth');
        await clearAuth();
        setUser(null);
      }
    } catch (error) {
      // Network error or server error - don't log out, could be temporary
      console.log('[AuthContext] Error validating auth on resume:', error);
    }
  };

  // Check for existing auth on app load
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await getToken();
      if (token) {
        // Try to get user from storage first
        const storedUser = await getUser();
        if (storedUser) {
          setUser(storedUser);
        } else {
          // Fallback to fetching from server
          const serverUser = await authService.getCurrentUser();
          if (serverUser) {
            setUser(serverUser);
          } else {
            // Token invalid, clear auth
            await clearAuth();
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      await clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await authService.signup({ email, password, name });
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = (response: GoogleAuthResponse) => {
    // Token and user are already stored by the Google auth service
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear user state, even if storage clear fails
      setUser(null);
    }
  };

  const refreshUser = async () => {
    const serverUser = await authService.getCurrentUser();
    if (serverUser) {
      setUser(serverUser);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    loginWithGoogle,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
