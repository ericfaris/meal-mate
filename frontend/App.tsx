import React, { useState, useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Linking } from 'react-native';
import Constants from 'expo-constants';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ErrorModal, { ErrorModalRef } from './src/components/ErrorModal';
import SuccessModal, { SuccessModalRef } from './src/components/SuccessModal';
import { alertManager } from './src/utils/alertUtils';
import { colors } from './src/theme';

// Get version info from app config
const appVersion = Constants.expoConfig?.extra?.appVersion || Constants.expoConfig?.version || '1.0.0';
const buildNumber = Constants.expoConfig?.extra?.buildNumber || 1;

// Log version at startup
console.log(`\n🍽️  Meal Mate v${appVersion} (build ${buildNumber})`);
console.log('━'.repeat(50));

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const errorModalRef = useRef<ErrorModalRef>(null);
  const successModalRef = useRef<SuccessModalRef>(null);

  useEffect(() => {
    alertManager.setErrorModal(errorModalRef.current);
    alertManager.setSuccessModal(successModalRef.current);
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
      linking={{
        prefixes: ['exp://localhost:8081', 'mealmate://'],
        config: {
          screens: {
            Main: {
              screens: {
                Settings: 'join/:token',
              },
            },
          },
        },
        async getInitialURL() {
          const url = await Linking.getInitialURL();
          return url;
        },
        subscribe(listener) {
          const onReceiveURL = ({ url }: { url: string }) => listener(url);
          const subscription = Linking.addEventListener('url', onReceiveURL);
          return () => subscription?.remove();
        },
      }}
    >
      <StatusBar style="light" />
      <BottomTabNavigator />
      
      {/* Global Alert Modals */}
      <ErrorModal ref={errorModalRef} />
      <SuccessModal ref={successModalRef} />
    </NavigationContainer>
  );
}

export default function App() {
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
