import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import {
  GoogleConfig,
  getGoogleConfig,
  handleGoogleSignIn,
  GoogleAuthResponse,
} from '../../services/auth/google';

// Required for web
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSuccess: (response: GoogleAuthResponse) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

// Inner component that uses the Google auth hook (only rendered when config is ready)
function GoogleAuthButton({
  config,
  onSuccess,
  onError,
  disabled,
}: {
  config: GoogleConfig;
  onSuccess: (response: GoogleAuthResponse) => void;
  onError?: (error: Error) => void;
  disabled: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  // Setup Google auth request - only called when config is available
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: config.webClientId,
    iosClientId: config.iosClientId,
    androidClientId: config.androidClientId,
    scopes: ['profile', 'email'],
  });

  // Handle auth response
  useEffect(() => {
    if (response) {
      handleResponse();
    }
  }, [response]);

  const handleResponse = async () => {
    if (!response) return;

    setIsLoading(true);
    try {
      const result = await handleGoogleSignIn(response);
      if (result) {
        onSuccess(result);
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      onError?.(error);
      Alert.alert('Sign-In Failed', error.message || 'Could not sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = async () => {
    setIsLoading(true);
    try {
      await promptAsync();
    } catch (error: any) {
      console.error('Google prompt error:', error);
      setIsLoading(false);
    }
  };

  const isDisabled = disabled || isLoading || !request;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={handlePress}
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

// Main component that loads config first
export default function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const [config, setConfig] = useState<GoogleConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Fetch Google config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setConfigLoading(true);
    const googleConfig = await getGoogleConfig();
    setConfig(googleConfig);
    setConfigLoading(false);
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

  // Render the inner component only when config is ready
  return (
    <GoogleAuthButton
      config={config}
      onSuccess={onSuccess}
      onError={onError}
      disabled={disabled}
    />
  );
}

// Google "G" icon component
function GoogleIcon() {
  return (
    <View style={styles.googleIcon}>
      <Text style={styles.googleIconText}>G</Text>
    </View>
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
  iconContainer: {
    marginRight: spacing.sm,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  buttonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
});
