import { apiClient, API_ENDPOINTS } from '../../config/api';
import { Restaurant, RestaurantInput, RestaurantStats } from '../../types';

export const restaurantApi = {
  // Get all restaurants (user's own + household shared)
  getAll: async (): Promise<Restaurant[]> => {
    const response = await apiClient.get(API_ENDPOINTS.restaurants);
    return response.data;
  },

  // Get single restaurant by ID
  getById: async (id: string): Promise<Restaurant> => {
    const response = await apiClient.get(`${API_ENDPOINTS.restaurants}/${id}`);
    return response.data;
  },

  // Create new restaurant
  create: async (restaurant: RestaurantInput): Promise<Restaurant> => {
    const response = await apiClient.post(API_ENDPOINTS.restaurants, restaurant);
    return response.data;
  },

  // Update existing restaurant
  update: async (id: string, restaurant: Partial<RestaurantInput>): Promise<Restaurant> => {
    const response = await apiClient.put(`${API_ENDPOINTS.restaurants}/${id}`, restaurant);
    return response.data;
  },

  // Delete restaurant
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.restaurants}/${id}`);
  },

  // Record visit (after spin selection)
  recordVisit: async (id: string): Promise<Restaurant> => {
    const response = await apiClient.post(`${API_ENDPOINTS.restaurants}/${id}/visit`);
    return response.data;
  },

  // Get visit statistics
  getStats: async (): Promise<RestaurantStats> => {
    const response = await apiClient.get(`${API_ENDPOINTS.restaurants}/stats`);
    return response.data;
  },

  // Get weighted random restaurant selection
  spin: async (): Promise<Restaurant> => {
    const response = await apiClient.post(`${API_ENDPOINTS.restaurants}/spin`);
    return response.data;
  },
};