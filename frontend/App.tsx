import React, { useState, useRef, useEffect } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
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

// Design system: apply the body face (Karla) as the app-wide default so the
// ~30 existing screens (which style text via `typography.sizes.*` without a
// fontFamily) pick it up automatically, with zero per-screen edits. Any
// screen/component can still opt into the display face (Fraunces) directly
// via `typography.families.display` for hero moments. See DESIGN.md "Type".
// @ts-ignore — defaultProps exists on RN's Text/TextInput at runtime.
Text.defaultProps = Text.defaultProps || {};
// @ts-ignore
Text.defaultProps.style = [{ fontFamily: 'Karla-Regular' }, Text.defaultProps.style];
// @ts-ignore
TextInput.defaultProps = TextInput.defaultProps || {};
// @ts-ignore
TextInput.defaultProps.style = [{ fontFamily: 'Karla-Regular' }, TextInput.defaultProps.style];

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
      linking={{
        // Web linking reads the browser URL directly; prefixes are unused.
        prefixes: [],
        config: {
          screens: {
            Main: {
              screens: {
                Settings: 'join/:token',
                GroceryTab: {
                  screens: {
                    GroceryStoreMode: 'grocery/:listId',
                  },
                },
              },
            },
          },
        },
      }}
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
