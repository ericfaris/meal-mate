import { apiClient, API_ENDPOINTS } from '../../config/api';
import { GroceryList, CreateGroceryListRequest } from '../../types';

export const groceryListApi = {
  create: async (data: CreateGroceryListRequest): Promise<GroceryList> => {
    const response = await apiClient.post(API_ENDPOINTS.groceryLists, data);
    return response.data;
  },

  getAll: async (status?: string): Promise<GroceryList[]> => {
    const params = status ? { status } : undefined;
    const response = await apiClient.get(API_ENDPOINTS.groceryLists, { params });
    return response.data;
  },

  getById: async (id: string): Promise<GroceryList> => {
    const response = await apiClient.get(`${API_ENDPOINTS.groceryLists}/${id}`);
    return response.data;
  },

  update: async (id: string, data: { name?: string; status?: string }): Promise<GroceryList> => {
    const response = await apiClient.put(`${API_ENDPOINTS.groceryLists}/${id}`, data);
    return response.data;
  },

  updateItem: async (
    listId: string,
    itemIndex: number,
    updates: { isChecked?: boolean; quantity?: string; name?: string }
  ): Promise<GroceryList> => {
    const response = await apiClient.put(
      `${API_ENDPOINTS.groceryLists}/${listId}/items/${itemIndex}`,
      updates
    );
    return response.data;
  },

  addItem: async (
    listId: string,
    item: { name: string; quantity?: string; category?: string }
  ): Promise<GroceryList> => {
    const response = await apiClient.post(
      `${API_ENDPOINTS.groceryLists}/${listId}/items`,
      item
    );
    return response.data;
  },

  removeItem: async (listId: string, itemIndex: number): Promise<GroceryList> => {
    const response = await apiClient.delete(
      `${API_ENDPOINTS.groceryLists}/${listId}/items/${itemIndex}`
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.groceryLists}/${id}`);
  },
};
