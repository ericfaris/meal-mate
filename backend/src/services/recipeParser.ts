import axios from 'axios';
const cheerio = require('cheerio');

export interface ParsedRecipe {
  title: string;
  imageUrl?: string;
  ingredientsText: string;
  directionsText: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
}

/**
 * Attempts to parse a recipe from a URL using multiple strategies:
 * 1. JSON-LD structured data (Schema.org Recipe)
 * 2. Microdata (itemtype Recipe)
 * 3. Common HTML patterns
 */
export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  // Fetch the page HTML with browser-like headers
  let response;
  try {
    response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000,
      maxRedirects: 5,
    });
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error('BLOCKED: This site is blocking automated access. Try a different recipe site like AllRecipes or Serious Eats.');
    }
    if (error.response?.status === 404) {
      throw new Error('Recipe page not found. Please check the URL and try again.');
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. The site may be slow or blocking access.');
    }
    throw new Error(`Failed to fetch page: ${error.message}`);
  }

  const html = response.data;
  const $ = cheerio.load(html);

  // Try JSON-LD first (most reliable)
  let recipe = tryParseJsonLd($);
  if (recipe) {
    console.log('Parsed recipe using JSON-LD');
    return recipe;
  }

  // Try microdata
  recipe = tryParseMicrodata($);
  if (recipe) {
    console.log('Parsed recipe using Microdata');
    return recipe;
  }

  // Try common HTML patterns as last resort
  recipe = tryParseHtmlPatterns($);
  if (recipe) {
    console.log('Parsed recipe using HTML patterns');
    return recipe;
  }

  throw new Error('Could not find recipe data on this page. The site may not have structured recipe data.');
}

/**
 * Try to parse JSON-LD structured data (Schema.org Recipe format)
 */
function tryParseJsonLd($: any): ParsedRecipe | null {
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    try {
      const content = $(scripts[i]).html();
      if (!content) continue;

      let data = JSON.parse(content);

      // Handle @graph array (common in WordPress sites)
      if (data['@graph']) {
        data = data['@graph'];
      }

      // If it's an array, find the Recipe object
      if (Array.isArray(data)) {
        data = data.find((item: any) =>
          item['@type'] === 'Recipe' ||
          (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
        );
      }

      // Check if this is a Recipe schema
      if (!data) continue;

      const type = data['@type'];
      const isRecipe = type === 'Recipe' ||
        (Array.isArray(type) && type.includes('Recipe'));

      if (!isRecipe) continue;

      return extractRecipeFromSchema(data);
    } catch (e) {
      // JSON parse error, try next script
      continue;
    }
  }

  return null;
}

/**
 * Try to parse microdata (itemtype="https://schema.org/Recipe")
 */
function tryParseMicrodata($: any): ParsedRecipe | null {
  const recipeElement = $('[itemtype*="schema.org/Recipe"]');
  if (recipeElement.length === 0) return null;

  const getItemProp = (prop: string): string => {
    const el = recipeElement.find(`[itemprop="${prop}"]`);
    return el.attr('content') || el.text().trim();
  };

  const getItemPropAll = (prop: string): string[] => {
    const elements = recipeElement.find(`[itemprop="${prop}"]`);
    const results: string[] = [];
    elements.each((_: any, el: any) => {
      const text = $(el).attr('content') || $(el).text().trim();
      if (text) results.push(text);
    });
    return results;
  };

  const title = getItemProp('name');
  if (!title) return null;

  const ingredients = getItemPropAll('recipeIngredient');
  const instructions = getItemPropAll('recipeInstructions');

  if (ingredients.length === 0 && instructions.length === 0) return null;

  return {
    title,
    imageUrl: getItemProp('image') || undefined,
    ingredientsText: ingredients.join('\n'),
    directionsText: instructions.join('\n'),
    description: getItemProp('description') || undefined,
    prepTime: parseDuration(getItemProp('prepTime')),
    cookTime: parseDuration(getItemProp('cookTime')),
    servings: parseServings(getItemProp('recipeYield')),
  };
}

/**
 * Try common HTML patterns as a fallback
 */
function tryParseHtmlPatterns($: any): ParsedRecipe | null {
  // Common class/id patterns for recipe titles
  const titleSelectors = [
    'h1.recipe-title',
    'h1.entry-title',
    'h1[class*="recipe"]',
    'h1[class*="title"]',
    '.recipe-header h1',
    '.recipe-name',
    'article h1',
    'h1',
  ];

  let title = '';
  for (const selector of titleSelectors) {
    const el = $(selector).first();
    if (el.length && el.text().trim()) {
      title = el.text().trim();
      break;
    }
  }

  if (!title) return null;

  // Common patterns for ingredients
  const ingredientSelectors = [
    '.recipe-ingredients li',
    '.ingredients li',
    '[class*="ingredient"] li',
    '.ingredient-list li',
    'ul[class*="ingredient"] li',
    '.wprm-recipe-ingredient',
  ];

  let ingredients: string[] = [];
  for (const selector of ingredientSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      elements.each((_: any, el: any) => {
        const text = $(el).text().trim();
        if (text) ingredients.push(text);
      });
      break;
    }
  }

  // Common patterns for instructions
  const instructionSelectors = [
    '.recipe-instructions li',
    '.instructions li',
    '[class*="instruction"] li',
    '.recipe-directions li',
    '.directions li',
    '.wprm-recipe-instruction',
    '.recipe-steps li',
  ];

  let instructions: string[] = [];
  for (const selector of instructionSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      elements.each((_: any, el: any) => {
        const text = $(el).text().trim();
        if (text) instructions.push(text);
      });
      break;
    }
  }

  // Try to find instructions in paragraphs if list not found
  if (instructions.length === 0) {
    const instructionContainerSelectors = [
      '.recipe-instructions',
      '.instructions',
      '[class*="instruction"]',
      '.directions',
    ];

    for (const selector of instructionContainerSelectors) {
      const container = $(selector).first();
      if (container.length) {
        container.find('p').each((_: any, el: any) => {
          const text = $(el).text().trim();
          if (text) instructions.push(text);
        });
        if (instructions.length > 0) break;
      }
    }
  }

  if (ingredients.length === 0 && instructions.length === 0) return null;

  // Try to find image
  let imageUrl: string | undefined;
  const imageSelectors = [
    '.recipe-image img',
    '.recipe-photo img',
    '[class*="recipe"] img',
    'article img',
  ];

  for (const selector of imageSelectors) {
    const img = $(selector).first();
    if (img.length) {
      imageUrl = img.attr('src') || img.attr('data-src');
      if (imageUrl) break;
    }
  }

  return {
    title,
    imageUrl,
    ingredientsText: ingredients.join('\n'),
    directionsText: instructions.join('\n'),
  };
}

/**
 * Extract recipe data from Schema.org Recipe JSON-LD
 */
function extractRecipeFromSchema(data: any): ParsedRecipe {
  // Get title
  const title = data.name || 'Untitled Recipe';

  // Get image (can be string, array, or object)
  let imageUrl: string | undefined;
  if (data.image) {
    if (typeof data.image === 'string') {
      imageUrl = data.image;
    } else if (Array.isArray(data.image)) {
      imageUrl = typeof data.image[0] === 'string' ? data.image[0] : data.image[0]?.url;
    } else if (data.image.url) {
      imageUrl = data.image.url;
    }
  }

  // Get ingredients
  let ingredients: string[] = [];
  if (data.recipeIngredient) {
    ingredients = Array.isArray(data.recipeIngredient)
      ? data.recipeIngredient
      : [data.recipeIngredient];
  }

  // Get instructions (can be string, array of strings, or array of HowToStep objects)
  let instructions: string[] = [];
  if (data.recipeInstructions) {
    if (typeof data.recipeInstructions === 'string') {
      instructions = [data.recipeInstructions];
    } else if (Array.isArray(data.recipeInstructions)) {
      instructions = data.recipeInstructions.map((step: any) => {
        if (typeof step === 'string') return step;
        if (step.text) return step.text;
        if (step.itemListElement) {
          // HowToSection with nested steps
          return step.itemListElement.map((s: any) => s.text || s).join('\n');
        }
        return '';
      }).filter(Boolean);
    }
  }

  return {
    title,
    imageUrl,
    ingredientsText: ingredients.join('\n'),
    directionsText: instructions.join('\n'),
    description: data.description || undefined,
    prepTime: parseDuration(data.prepTime),
    cookTime: parseDuration(data.cookTime),
    servings: parseServings(data.recipeYield),
  };
}

/**
 * Parse ISO 8601 duration to minutes
 */
function parseDuration(duration: string | undefined): number | undefined {
  if (!duration) return undefined;

  // Match ISO 8601 duration format (e.g., PT30M, PT1H30M)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (match) {
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    return hours * 60 + minutes;
  }

  // Try to parse as plain number (minutes)
  const num = parseInt(duration, 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse recipe yield/servings to a number
 */
function parseServings(yield_: string | number | string[] | undefined): number | undefined {
  if (!yield_) return undefined;

  // Handle array
  if (Array.isArray(yield_)) {
    yield_ = yield_[0];
  }

  // Already a number
  if (typeof yield_ === 'number') return yield_;

  // Extract first number from string
  const match = String(yield_).match(/\d+/);
  return match ? parseInt(match[0], 10) : undefined;
}
