import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
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

  const handlePress = async () => {
    setIsLoading(true);
    try {
      const result = await handleGoogleSignIn();
      onSuccess(result);
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      onError?.(error);

      // Don't show alert for user cancellation
      if (error.message !== 'Sign-in was cancelled') {
        Alert.alert('Sign-In Failed', error.message || 'Could not sign in with Google');
      }
    } finally {
      setIsLoading(false);
    }
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

  const isDisabled = disabled || isLoading;

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
  iconContainer: {
    marginRight: spacing.sm,
  },
  buttonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
});
