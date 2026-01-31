import { apiClient, API_ENDPOINTS } from '../../config/api';
import { Staple, GroceryList } from '../../types';

export const staplesApi = {
  getAll: async (): Promise<Staple[]> => {
    const response = await apiClient.get(API_ENDPOINTS.staples);
    return response.data;
  },

  upsert: async (data: { name: string; quantity?: string; category?: string }): Promise<Staple> => {
    const response = await apiClient.post(API_ENDPOINTS.staples, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.staples}/${id}`);
  },

  clearAll: async (): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.staples);
  },

  addToGroceryList: async (listId: string, stapleIds: string[]): Promise<GroceryList> => {
    const response = await apiClient.post(
      `${API_ENDPOINTS.groceryLists}/${listId}/staples`,
      { stapleIds }
    );
    return response.data;
  },
};
