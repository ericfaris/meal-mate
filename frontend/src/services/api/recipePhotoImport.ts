import { apiClient, API_BASE_URL } from '../../config/api';

export interface ExtractedRecipe {
  title: string;
  ingredientsText: string;
  directionsText: string;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  tags: string[];
}

export const recipePhotoImportApi = {
  /**
   * Import a recipe by sending a photo to the backend for AI extraction
   * @param imageUri - Object URL of the chosen image
   * @returns Extracted recipe data
   */
  importFromPhoto: async (imageUri: string): Promise<ExtractedRecipe> => {
    const formData = new FormData();

    // Fetch the blob behind the object URL and append it as a file
    console.log('[PhotoAPI] Fetching blob from URI:', imageUri.substring(0, 80));
    const response = await fetch(imageUri);
    const blob = await response.blob();
    console.log('[PhotoAPI] Blob created, size:', blob.size, 'type:', blob.type);
    const extension = blob.type.split('/')[1] || 'jpg';
    formData.append('image', blob, `recipe.${extension}`);

    console.log('[PhotoAPI] Sending request to /api/recipes/import-photo');
    const result = await apiClient.post(
      `${API_BASE_URL}/api/recipes/import-photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60s timeout for AI processing
      }
    );
    console.log('[PhotoAPI] Response received:', result.status);
    return result.data;
  },
};
