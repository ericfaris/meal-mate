import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { colors, borderRadius, spacing, shadows } from '../../theme';
import {
  GoogleConfig,
  getGoogleConfig,
  handleGoogleSignIn,
  GoogleAuthResponse,
} from '../../services/auth/google';
import { alertManager } from '../../utils/alertUtils';

interface GoogleSignInButtonProps {
  onSuccess: (response: GoogleAuthResponse) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const [config, setConfig] = useState<GoogleConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Fetch the Google client ID from the backend on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setConfigLoading(true);
    const googleConfig = await getGoogleConfig();

    if (googleConfig && googleConfig.webClientId) {
      setConfig(googleConfig);
    }

    setConfigLoading(false);
  };

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
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
    }
  };

  const handleError = () => {
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

  return (
    <GoogleOAuthProvider clientId={config.webClientId}>
      <View style={styles.webContainer}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
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
});
