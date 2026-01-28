import { apiClient } from '../../config/api';

export const userApi = {
  /**
   * Save push token to server for notifications
   */
  savePushToken: async (pushToken: string): Promise<void> => {
    await apiClient.put('/api/users/push-token', { pushToken });
  },

  /**
   * Remove push token from server (on logout)
   */
  removePushToken: async (): Promise<void> => {
    await apiClient.delete('/api/users/push-token');
  },
};
