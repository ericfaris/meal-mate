import { apiClient } from '../../config/api';

export interface SearchImage {
  id: string;
  url: string;
  thumb: string;
  description: string | null;
  photographer: string;
  photographerUrl: string;
}

export type ImageSource = 'unsplash' | 'google';

export const imageSearchApi = {
  searchImages: async (query: string, source: ImageSource = 'unsplash'): Promise<SearchImage[]> => {
    const response = await apiClient.get('/api/images/search', {
      params: { query, source },
    });
    return response.data.images;
  },
};
