import { apiClient, API_ENDPOINTS } from '../../config/api';
import { Recipe } from '../../types';

export const recipeApi = {
  // Get all recipes with optional search and tag filters
  getAll: async (search?: string, tags?: string[]): Promise<Recipe[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tags && tags.length > 0) params.append('tags', tags.join(','));

    const response = await apiClient.get(
      `${API_ENDPOINTS.recipes}${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  // Get single recipe by ID
  getById: async (id: string): Promise<Recipe> => {
    const response = await apiClient.get(`${API_ENDPOINTS.recipes}/${id}`);
    return response.data;
  },

  // Create new recipe
  create: async (recipe: Omit<Recipe, '_id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> => {
    const response = await apiClient.post(API_ENDPOINTS.recipes, recipe);
    return response.data;
  },

  // Update existing recipe
  update: async (id: string, recipe: Partial<Recipe>): Promise<Recipe> => {
    const response = await apiClient.put(`${API_ENDPOINTS.recipes}/${id}`, recipe);
    return response.data;
  },

  // Delete recipe
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.recipes}/${id}`);
  },
};
