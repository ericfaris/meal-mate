import { apiClient, API_ENDPOINTS } from '../../config/api';
import { Store } from '../../types';

export const storesApi = {
  getAll: async (): Promise<Store[]> => {
    const response = await apiClient.get(API_ENDPOINTS.stores);
    return response.data;
  },

  create: async (data: { name: string; categoryOrder?: string[]; imageUrl?: string }): Promise<Store> => {
    const response = await apiClient.post(API_ENDPOINTS.stores, data);
    return response.data;
  },

  update: async (id: string, data: { name?: string; categoryOrder?: string[]; isDefault?: boolean; imageUrl?: string }): Promise<Store> => {
    const response = await apiClient.put(`${API_ENDPOINTS.stores}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.stores}/${id}`);
  },

  reorder: async (storeIds: string[]): Promise<Store[]> => {
    const response = await apiClient.put(`${API_ENDPOINTS.stores}/reorder`, { storeIds });
    return response.data;
  },
};
