import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { userApi } from './api/user';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Register for push notifications and get the Expo push token
 * @returns The Expo push token or null if registration fails
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications require a physical device');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted for push notifications');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '910a682b-5db4-440a-af99-ee987b813edf', // EAS project ID
    });

    const token = tokenData.data;
    console.log('[Notifications] Expo push token:', token);

    return token;
  } catch (error) {
    console.error('[Notifications] Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Setup Android notification channel for recipe submissions
 */
export const setupNotificationChannels = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('submissions', {
      name: 'Recipe Submissions',
      description: 'Notifications for new recipe submissions requiring approval',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A90A4',
    });

    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      description: 'General notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
};

/**
 * Register for push notifications and save token to server
 */
export const initializePushNotifications = async (): Promise<void> => {
  try {
    // Setup notification channels first (Android)
    await setupNotificationChannels();

    // Register for push notifications
    const token = await registerForPushNotifications();

    if (token) {
      // Save token to server
      await userApi.savePushToken(token);
      console.log('[Notifications] Push token saved to server');
    }
  } catch (error) {
    console.error('[Notifications] Error initializing push notifications:', error);
    // Don't throw - notification setup failure shouldn't block app usage
  }
};

/**
 * Remove push token from server (call on logout)
 */
export const cleanupPushNotifications = async (): Promise<void> => {
  try {
    await userApi.removePushToken();
    console.log('[Notifications] Push token removed from server');
  } catch (error) {
    console.error('[Notifications] Error removing push token:', error);
    // Don't throw - cleanup failure shouldn't block logout
  }
};

/**
 * Add a listener for notification responses (when user taps notification)
 * @param callback Function to call with notification data
 * @returns Subscription that should be removed on cleanup
 */
export const addNotificationResponseListener = (
  callback: (data: Record<string, any>) => void
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    console.log('[Notifications] Notification tapped with data:', data);
    callback(data);
  });
};

/**
 * Add a listener for notifications received while app is in foreground
 * @param callback Function to call with notification
 * @returns Subscription that should be removed on cleanup
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription => {
  return Notifications.addNotificationReceivedListener((notification) => {
    console.log('[Notifications] Notification received in foreground:', notification);
    callback(notification);
  });
};
