import { Request, Response } from 'express';
import axios from 'axios';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

export const searchImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, source = 'unsplash' } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }

    if (source === 'google') {
      // Google Custom Search
      if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
        res.status(500).json({
          error: 'Google API not configured. Please set up GOOGLE_API_KEY and GOOGLE_CSE_ID in your .env file.',
          details: 'Visit https://developers.google.com/custom-search/v1/overview to set up Google Custom Search API'
        });
        return;
      }

      try {
        const searchQuery = `${query} food`;
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: GOOGLE_API_KEY,
            cx: GOOGLE_CSE_ID,
            q: searchQuery,
            searchType: 'image',
            num: 10,
            imgSize: 'medium',
            safe: 'active',
          },
        });

        if (!response.data.items || response.data.items.length === 0) {
          res.json({ images: [] });
          return;
        }

        const images = response.data.items.map((item: any) => ({
          id: item.link,
          url: item.link,
          thumb: item.image?.thumbnailLink || item.link,
          description: item.title,
          photographer: item.displayLink,
          photographerUrl: item.image?.contextLink || item.link,
        }));

        res.json({ images });
      } catch (googleError: any) {
        console.error('Google Custom Search error:', googleError.response?.data || googleError.message);
        const errorDetails = googleError.response?.data?.error;
        res.status(500).json({
          error: 'Google Image Search failed. The Custom Search Engine may not be configured for image search.',
          details: errorDetails?.message || 'Make sure your CSE has "Image search" enabled and searches the entire web.',
          googleError: errorDetails
        });
        return;
      }
    } else {
      // Unsplash search
      if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY_HERE') {
        res.status(500).json({ error: 'Unsplash API key not configured' });
        return;
      }

      const searchQuery = `${query} food dish recipe`;
      const response = await axios.get(`${UNSPLASH_API_URL}/search/photos`, {
        params: {
          query: searchQuery,
          per_page: 12,
          orientation: 'landscape',
        },
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      });

      const images = response.data.results.map((photo: any) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        description: photo.description || photo.alt_description,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
      }));

      res.json({ images });
    }
  } catch (error) {
    console.error('Error searching images:', error);
    res.status(500).json({ error: 'Failed to search images' });
  }
};
