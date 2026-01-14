import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import {
  GoogleConfig,
  getGoogleConfig,
  configureGoogleSignIn,
  handleGoogleSignIn,
  GoogleAuthResponse,
} from '../../services/auth/google';
import { alertManager } from '../../utils/alertUtils';

// Web-only imports
let GoogleOAuthProvider: any;
let GoogleLogin: any;
if (Platform.OS === 'web') {
  const googleOAuth = require('@react-oauth/google');
  GoogleOAuthProvider = googleOAuth.GoogleOAuthProvider;
  GoogleLogin = googleOAuth.GoogleLogin;
}

interface GoogleSignInButtonProps {
  onSuccess: (response: GoogleAuthResponse) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const [config, setConfig] = useState<GoogleConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch and configure Google Sign-In on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setConfigLoading(true);
    const googleConfig = await getGoogleConfig();

    if (googleConfig && googleConfig.webClientId) {
      setConfig(googleConfig);
      // Configure Google Sign-In with the fetched config
      configureGoogleSignIn(googleConfig);
    }

    setConfigLoading(false);
  };

  // Native platform handler
  const handlePressNative = async () => {
    setIsLoading(true);
    try {
      const result = await handleGoogleSignIn(config || undefined);
      onSuccess(result);
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      onError?.(error);

      if (error.message !== 'Sign-in was cancelled') {
        alertManager.showError({
          title: 'Sign-In Failed',
          message: error.message || 'Could not sign in with Google',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Web platform handler
  const handleWebSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const credential = credentialResponse.credential;
      if (!credential) {
        throw new Error('No credential received from Google');
      }
      const result = await handleGoogleSignIn(credential);
      onSuccess(result);
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      onError?.(error);
      alertManager.showError({
        title: 'Sign-In Failed',
        message: error.message || 'Could not sign in with Google',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebError = () => {
    console.error('Google Sign-In failed');
    onError?.(new Error('Google Sign-In failed'));
  };

  if (configLoading) {
    return (
      <View style={[styles.button, styles.buttonDisabled]}>
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  }

  // Don't show button if no valid config (no webClientId configured)
  if (!config || !config.webClientId) {
    return null;
  }

  // Web platform: Use @react-oauth/google
  if (Platform.OS === 'web' && GoogleOAuthProvider && GoogleLogin) {
    return (
      <GoogleOAuthProvider clientId={config.webClientId}>
        <View style={styles.webContainer}>
          <GoogleLogin
            onSuccess={handleWebSuccess}
            onError={handleWebError}
            useOneTap
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
          />
        </View>
      </GoogleOAuthProvider>
    );
  }

  // Native platforms: Use TouchableOpacity button
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={handlePressNative}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <>
          <View style={styles.iconContainer}>
            <GoogleIcon />
          </View>
          <Text style={styles.buttonText}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// Google "G" icon component
function GoogleIcon() {
  return <FontAwesome name="google" size={16} color="#4285F4" />;
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.button,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  webContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  buttonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
});
