import { apiClient } from '../../config/api';

export interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  description: string | null;
  photographer: string;
  photographerUrl: string;
}

export const imageSearchApi = {
  searchImages: async (query: string): Promise<UnsplashImage[]> => {
    const response = await apiClient.get('/api/images/search', {
      params: { query },
    });
    return response.data.images;
  },
};
