import React, { useState, useRef, useEffect } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { linking } from './src/navigation/linking';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ErrorModal, { ErrorModalRef } from './src/components/ErrorModal';
import SuccessModal, { SuccessModalRef } from './src/components/SuccessModal';
import ConfirmModal, { ConfirmModalRef } from './src/components/ConfirmModal';
import InfoModal, { InfoModalRef } from './src/components/InfoModal';
import ActionSheetModal, { ActionSheetModalRef } from './src/components/ActionSheetModal';
import { alertManager } from './src/utils/alertUtils';
import { colors } from './src/theme';
import { APP_VERSION, BUILD_NUMBER } from './src/config/version';

// Log version at startup
console.log(`\n🍽️  Meal Mate v${APP_VERSION} (build ${BUILD_NUMBER})`);
console.log('━'.repeat(50));

// Type defaults (Karla body, Fraunces display) are applied by the
// `react-native` platform shim — see src/platform/reactNative.tsx.

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const errorModalRef = useRef<ErrorModalRef>(null);
  const successModalRef = useRef<SuccessModalRef>(null);
  const confirmModalRef = useRef<ConfirmModalRef>(null);
  const infoModalRef = useRef<InfoModalRef>(null);
  const actionSheetModalRef = useRef<ActionSheetModalRef>(null);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    alertManager.setErrorModal(errorModalRef.current);
    alertManager.setSuccessModal(successModalRef.current);
    alertManager.setConfirmModal(confirmModalRef.current);
    alertManager.setInfoModal(infoModalRef.current);
    alertManager.setActionSheetModal(actionSheetModalRef.current);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return showLogin ? (
      <LoginScreen onNavigateToSignup={() => setShowLogin(false)} />
    ) : (
      <SignupScreen onNavigateToLogin={() => setShowLogin(true)} />
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
    >
      <BottomTabNavigator />
      
      {/* Global Alert Modals */}
      <ErrorModal ref={errorModalRef} />
      <SuccessModal ref={successModalRef} />
      <ConfirmModal ref={confirmModalRef} />
      <InfoModal ref={infoModalRef} />
      <ActionSheetModal ref={actionSheetModalRef} />
    </NavigationContainer>
  );
}

export default function App() {
  // Fonts (Karla, Fraunces, Ionicons) load via @font-face in index.html.
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
