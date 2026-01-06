import { Request, Response } from 'express';
import Recipe from '../models/recipe';
import { parseRecipeFromUrl } from '../services/recipeParser';

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
    const { url } = req.body;

    // Validation
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      res.status(400).json({ error: 'Invalid URL format' });
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

    // Map scraped data to our Recipe model
    const ingredientsText = Array.isArray(scrapedData.ingredients)
      ? scrapedData.ingredients.join('\n')
      : scrapedData.ingredients || '';

    const directionsText = Array.isArray(scrapedData.instructions)
      ? scrapedData.instructions.join('\n')
      : scrapedData.instructions || '';

    // Extract time values (convert to numbers if possible)
    const prepTime = scrapedData.time?.prep ? parseInt(scrapedData.time.prep) : undefined;
    const cookTime = scrapedData.time?.cook ? parseInt(scrapedData.time.cook) : undefined;

    // Extract servings (convert to number if possible)
    const servings = scrapedData.servings ? parseInt(scrapedData.servings) : undefined;

    // Determine complexity based on ingredient count and cook time
    let complexity: 'simple' | 'medium' | 'complex' | undefined = undefined;
    const ingredientCount = Array.isArray(scrapedData.ingredients)
      ? scrapedData.ingredients.length
      : 0;

    if (ingredientCount > 0) {
      if (ingredientCount <= 5 && (!cookTime || cookTime <= 20)) {
        complexity = 'simple';
      } else if (ingredientCount <= 10 && (!cookTime || cookTime <= 45)) {
        complexity = 'medium';
      } else {
        complexity = 'complex';
      }
    }

    // Create recipe
    const recipe = new Recipe({
      userId: req.userId,
      title: scrapedData.name || scrapedData.title || 'Untitled Recipe',
      imageUrl: scrapedData.image || '',
      sourceUrl: url,
      ingredientsText,
      directionsText,
      notes: scrapedData.description || '',
      tags: [], // User can add tags later
      complexity,
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
