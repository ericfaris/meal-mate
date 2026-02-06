import { Request, Response } from 'express';
import Recipe from '../models/recipe';
import User from '../models/user';
import { parseRecipeFromUrl } from '../services/recipeParser';
import { validateExternalUrl } from '../utils/urlValidation';

// Try to use recipe-scraper first, fall back to our custom parser
let recipeScraper: any = null;
try {
  recipeScraper = require('recipe-scraper');
} catch (e) {
  console.log('recipe-scraper not available, using custom parser only');
}

// POST /api/recipes/import - Import recipe from URL
export const importRecipeFromUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Check if user is admin in their household
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Only household admins can import recipes' });
      return;
    }

    const { url } = req.body;

    // Validation
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Validate URL format and block internal/private URLs (SSRF protection)
    const urlError = validateExternalUrl(url);
    if (urlError) {
      res.status(400).json({ error: urlError });
      return;
    }

    let scrapedData: any = null;
    let parseError: Error | null = null;

    // Try recipe-scraper library first (it has good site-specific parsers)
    if (recipeScraper) {
      try {
        scrapedData = await recipeScraper(url);
        console.log('Successfully scraped with recipe-scraper');
      } catch (error) {
        parseError = error as Error;
        console.log('recipe-scraper failed, trying custom parser...');
      }
    }

    // Fall back to our custom parser if recipe-scraper failed
    if (!scrapedData) {
      try {
        const parsed = await parseRecipeFromUrl(url);
        scrapedData = {
          name: parsed.title,
          image: parsed.imageUrl,
          ingredients: parsed.ingredientsText.split('\n').filter(Boolean),
          instructions: parsed.directionsText.split('\n').filter(Boolean),
          description: parsed.description,
          time: {
            prep: parsed.prepTime?.toString(),
            cook: parsed.cookTime?.toString(),
          },
          servings: parsed.servings?.toString(),
        };
        console.log('Successfully parsed with custom parser');
      } catch (customError: any) {
        console.error('Custom parser also failed:', customError.message);

        // Check for specific error types
        const errorMessage = customError.message || '';

        if (errorMessage.includes('BLOCKED')) {
          res.status(400).json({
            error: 'This site is blocking recipe imports. Some sites like Food Network use bot protection. Try these alternatives:\n\n• AllRecipes (allrecipes.com)\n• Serious Eats (seriouseats.com)\n• Bon Appetit (bonappetit.com)\n• Budget Bytes (budgetbytes.com)\n• Simply Recipes (simplyrecipes.com)'
          });
          return;
        }

        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          res.status(400).json({
            error: 'Recipe page not found. Please check that the URL is correct and points to a specific recipe page.'
          });
          return;
        }

        // Generic error
        res.status(400).json({
          error: 'Could not extract recipe from this page. The site may not have structured recipe data. Try using the manual entry option or a different recipe site.'
        });
        return;
      }
    }

    // Helper function to decode HTML entities
    const decodeHtmlEntities = (text: string): string => {
      if (!text) return text;

      const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#34;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&#x27;': "'",
        '&rsquo;': '\u2019',
        '&lsquo;': '\u2018',
        '&rdquo;': '\u201D',
        '&ldquo;': '\u201C',
        '&ndash;': '\u2013',
        '&mdash;': '\u2014',
        '&hellip;': '\u2026',
        '&nbsp;': ' ',
        '&#8217;': '\u2019',
        '&#8216;': '\u2018',
        '&#8220;': '\u201C',
        '&#8221;': '\u201D',
        '&#8211;': '\u2013',
        '&#8212;': '\u2014',
        '&#8230;': '\u2026',
      };

      let decoded = text;
      for (const [entity, char] of Object.entries(entities)) {
        decoded = decoded.replace(new RegExp(entity, 'g'), char);
      }

      decoded = decoded.replace(/&#(\d+);/g, (_match, dec) => {
        return String.fromCharCode(parseInt(dec, 10));
      });

      decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (_match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      });

      return decoded;
    };

    // Map scraped data to our Recipe model with HTML entity decoding
    const ingredientsText = Array.isArray(scrapedData.ingredients)
      ? scrapedData.ingredients.map((i: string) => decodeHtmlEntities(i)).join('\n')
      : decodeHtmlEntities(scrapedData.ingredients || '');

    const directionsText = Array.isArray(scrapedData.instructions)
      ? scrapedData.instructions.map((i: string) => decodeHtmlEntities(i)).join('\n')
      : decodeHtmlEntities(scrapedData.instructions || '');

    // Extract time values (convert to numbers if possible)
    const prepTime = scrapedData.time?.prep ? parseInt(scrapedData.time.prep) : undefined;
    const cookTime = scrapedData.time?.cook ? parseInt(scrapedData.time.cook) : undefined;

    // Extract servings (convert to number if possible)
    const servings = scrapedData.servings ? parseInt(scrapedData.servings) : undefined;

    // Create recipe
    const recipe = new Recipe({
      userId: req.userId,
      title: decodeHtmlEntities(scrapedData.name || scrapedData.title || 'Untitled Recipe'),
      imageUrl: scrapedData.image || '',
      sourceUrl: url,
      ingredientsText,
      directionsText,
      notes: decodeHtmlEntities(scrapedData.description || ''),
      tags: [], // User can add tags later
      isVegetarian: false, // User can update this later
      prepTime,
      cookTime,
      servings,
    });

    await recipe.save();
    res.status(201).json(recipe);
  } catch (error) {
    console.error('Error importing recipe:', error);
    res.status(500).json({ error: 'Failed to import recipe. Please try again.' });
  }
};
