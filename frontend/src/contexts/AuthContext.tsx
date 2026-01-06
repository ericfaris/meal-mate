import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getToken, getUser, clearAuth, StoredUser } from '../services/storage';
import * as authService from '../services/auth';
import { GoogleAuthResponse } from '../services/auth/google';

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
