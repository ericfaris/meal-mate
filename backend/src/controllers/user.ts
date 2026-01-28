import { Request, Response } from 'express';
import User from '../models/user';

/**
 * Update the user's push token for notifications
 * PUT /api/users/push-token
 */
export const updatePushToken = async (req: Request, res: Response) => {
  try {
    const { pushToken } = req.body;
    const userId = req.userId;

    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({ message: 'Push token is required' });
    }

    // Validate Expo push token format
    if (!pushToken.startsWith('ExponentPushToken[')) {
      return res.status(400).json({ message: 'Invalid push token format' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { pushToken },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[User] Push token updated for user ${userId}`);

    res.json({ message: 'Push token updated successfully' });
  } catch (error: any) {
    console.error('Error updating push token:', error);
    res.status(500).json({ message: 'Failed to update push token' });
  }
};

/**
 * Remove the user's push token (on logout)
 * DELETE /api/users/push-token
 */
export const removePushToken = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { $unset: { pushToken: 1 } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[User] Push token removed for user ${userId}`);

    res.json({ message: 'Push token removed successfully' });
  } catch (error: any) {
    console.error('Error removing push token:', error);
    res.status(500).json({ message: 'Failed to remove push token' });
  }
};
