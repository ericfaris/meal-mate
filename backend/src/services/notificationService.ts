import axios from 'axios';
import User from '../models/user';
import mongoose from 'mongoose';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: any;
}

/**
 * Send push notifications via Expo Push API
 * @param tokens Array of Expo push tokens
 * @param title Notification title
 * @param body Notification body
 * @param data Optional data payload for navigation
 * @returns Array of push tickets
 */
export const sendPushNotifications = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<ExpoPushTicket[]> => {
  if (tokens.length === 0) {
    console.log('[Notifications] No tokens to send to');
    return [];
  }

  // Filter valid Expo push tokens
  const validTokens = tokens.filter(token =>
    token && token.startsWith('ExponentPushToken[')
  );

  if (validTokens.length === 0) {
    console.log('[Notifications] No valid Expo push tokens found');
    return [];
  }

  // Build messages for each token
  const messages: ExpoPushMessage[] = validTokens.map(token => ({
    to: token,
    title,
    body,
    data,
    sound: 'default',
    channelId: 'submissions', // Android notification channel
  }));

  try {
    console.log(`[Notifications] Sending ${messages.length} push notification(s)`);

    const response = await axios.post<ExpoPushTicket[]>(EXPO_PUSH_URL, messages, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    console.log('[Notifications] Push response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Notifications] Error sending push notifications:', error.message);
    // Don't throw - we don't want to block the main operation
    return [];
  }
};

/**
 * Notify all admins of a household about a new recipe submission
 * @param householdId The household ID
 * @param submitterName Name of the member who submitted the recipe
 */
export const notifyHouseholdAdmins = async (
  householdId: mongoose.Types.ObjectId | string,
  submitterName: string
): Promise<void> => {
  try {
    // Find all admins in the household who have push tokens
    const admins = await User.find({
      householdId: householdId,
      role: 'admin',
      pushToken: { $exists: true, $nin: [null, ''] },
    }).select('pushToken name');

    if (admins.length === 0) {
      console.log('[Notifications] No admins with push tokens found for household');
      return;
    }

    const tokens = admins.map(admin => admin.pushToken).filter(Boolean) as string[];

    console.log(`[Notifications] Found ${tokens.length} admin(s) with push tokens`);

    await sendPushNotifications(
      tokens,
      'New Recipe Submission',
      `${submitterName} submitted a recipe for your approval`,
      {
        screen: 'Household',
        type: 'recipe_submission',
      }
    );
  } catch (error: any) {
    // Log but don't throw - notification failures shouldn't block submissions
    console.error('[Notifications] Error notifying household admins:', error.message);
  }
};
