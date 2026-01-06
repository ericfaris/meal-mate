import { apiClient, API_ENDPOINTS } from '../../config/api';
import { Recipe } from '../../types';

export const recipeImportApi = {
  /**
   * Import a recipe from a URL
   * @param url - The URL of the recipe to import
   * @returns The imported Recipe object
   */
  importFromUrl: async (url: string): Promise<Recipe> => {
    const response = await apiClient.post(API_ENDPOINTS.recipeImport, { url });
    return response.data;
  },
};
