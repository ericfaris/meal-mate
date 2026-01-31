import Anthropic from '@anthropic-ai/sdk';
import { IRecipe } from '../models/recipe';

export interface ParsedIngredient {
  name: string;
  quantity: string;
  category: 'Produce' | 'Meat & Seafood' | 'Dairy & Eggs' | 'Pantry' | 'Frozen' | 'Bakery' | 'Household' | 'Other';
  recipeId: string;
  recipeName: string;
  originalText: string;
}

export interface AggregatedIngredient {
  name: string;
  quantity: string;
  category: ParsedIngredient['category'];
  recipeIds: string[];
  recipeNames: string[];
  originalTexts: string[];
}

/**
 * Parse ingredients from multiple recipes using Claude AI.
 * Returns null if API key is missing or call fails (caller should use fallback).
 */
export async function parseIngredientsWithAI(
  recipes: IRecipe[]
): Promise<ParsedIngredient[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const recipeData = recipes
      .filter((r) => r.ingredientsText?.trim())
      .map((r) => ({
        id: r._id.toString(),
        title: r.title,
        ingredients: r.ingredientsText,
      }));

    if (recipeData.length === 0) return [];

    const prompt = `Parse the ingredients from these recipes into structured data. For each ingredient line, extract the item name (normalized — e.g. "onion" not "large yellow onion"), quantity with unit (e.g. "2 lbs", "1 cup", "3"), and categorize it.

RECIPES:
${JSON.stringify(recipeData, null, 0)}

CATEGORIES (pick one per item):
- Produce (fruits, vegetables, herbs, fresh items)
- Meat & Seafood (chicken, beef, fish, etc.)
- Dairy & Eggs (milk, cheese, butter, eggs, yogurt)
- Pantry (oils, spices, canned goods, pasta, rice, flour, sugar, sauces)
- Frozen (frozen vegetables, frozen meals, ice cream)
- Bakery (bread, rolls, tortillas, baked goods)
- Other (anything that doesn't fit above)

Respond with ONLY a JSON array: [{"name":"item name","quantity":"amount with unit","category":"Category","recipeId":"id","originalText":"original line"}]
No explanation, no markdown fences.`;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed: any[] = JSON.parse(text.trim());

    // Build recipe name lookup
    const nameMap = new Map(recipes.map((r) => [r._id.toString(), r.title]));

    return parsed.map((item) => ({
      name: item.name || 'Unknown',
      quantity: item.quantity || '',
      category: item.category || 'Other',
      recipeId: item.recipeId,
      recipeName: nameMap.get(item.recipeId) || '',
      originalText: item.originalText || '',
    }));
  } catch (error) {
    console.error('AI ingredient parsing failed (using fallback):', error);
    return null;
  }
}

/**
 * Fallback regex-based ingredient parser. Categories default to 'Other'.
 */
export function parseIngredientsFallback(recipes: IRecipe[]): ParsedIngredient[] {
  const results: ParsedIngredient[] = [];

  for (const recipe of recipes) {
    if (!recipe.ingredientsText?.trim()) continue;

    const lines = recipe.ingredientsText
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    for (const line of lines) {
      const { name, quantity } = parseIngredientLine(line);
      results.push({
        name,
        quantity,
        category: guessCategory(name),
        recipeId: recipe._id.toString(),
        recipeName: recipe.title,
        originalText: line,
      });
    }
  }

  return results;
}

/**
 * Parse a single ingredient line into name and quantity.
 * Handles patterns like "2 cups flour", "1/2 lb chicken", "salt and pepper"
 */
function parseIngredientLine(line: string): { name: string; quantity: string } {
  // Remove leading bullet/dash/number markers
  const cleaned = line.replace(/^[\s\-\*\u2022\d\.]+\s*/, '').trim();

  // Match quantity pattern: number (with optional fraction) + optional unit
  const match = cleaned.match(
    /^([\d]+(?:[\/\.\s]+[\d]+)?(?:\s*[-–]\s*[\d\/\.]+)?)\s*(cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|liters?|quarts?|pints?|gallons?|cans?|packages?|bags?|bunche?s?|cloves?|stalks?|heads?|slices?|pieces?|sticks?|sprigs?)?\s*(?:of\s+)?(.*)/i
  );

  if (match) {
    const qty = match[2] ? `${match[1]} ${match[2]}` : match[1];
    const name = match[3] || cleaned;
    return { name: name.trim(), quantity: qty.trim() };
  }

  // Handle fractions at start like "½ cup milk"
  const fracMatch = cleaned.match(
    /^([½¼¾⅓⅔⅛]+(?:\s*[\d\/]*)?)\s*(cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|lbs?|pounds?|g|kg)?\s*(?:of\s+)?(.*)/i
  );

  if (fracMatch) {
    const qty = fracMatch[2] ? `${fracMatch[1]} ${fracMatch[2]}` : fracMatch[1];
    const name = fracMatch[3] || cleaned;
    return { name: name.trim(), quantity: qty.trim() };
  }

  return { name: cleaned, quantity: '' };
}

/**
 * Basic category guessing by keyword matching.
 */
function guessCategory(name: string): ParsedIngredient['category'] {
  const lower = name.toLowerCase();

  const produce = ['onion', 'garlic', 'tomato', 'pepper', 'lettuce', 'carrot', 'potato', 'celery',
    'broccoli', 'spinach', 'mushroom', 'zucchini', 'cucumber', 'avocado', 'lemon', 'lime',
    'apple', 'banana', 'berry', 'cilantro', 'parsley', 'basil', 'ginger', 'jalape', 'corn',
    'bean sprout', 'cabbage', 'kale', 'arugula', 'scallion', 'shallot', 'squash', 'pea'];

  const meat = ['chicken', 'beef', 'pork', 'turkey', 'bacon', 'sausage', 'ham', 'steak',
    'ground', 'salmon', 'shrimp', 'fish', 'tuna', 'lamb', 'crab', 'lobster', 'meat'];

  const dairy = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'sour cream',
    'mozzarella', 'parmesan', 'cheddar', 'ricotta', 'whipping cream'];

  const bakery = ['bread', 'roll', 'tortilla', 'bun', 'pita', 'naan', 'baguette', 'croissant'];

  const frozen = ['frozen'];

  if (produce.some((k) => lower.includes(k))) return 'Produce';
  if (meat.some((k) => lower.includes(k))) return 'Meat & Seafood';
  if (dairy.some((k) => lower.includes(k))) return 'Dairy & Eggs';
  if (bakery.some((k) => lower.includes(k))) return 'Bakery';
  if (frozen.some((k) => lower.includes(k))) return 'Frozen';

  return 'Pantry';
}

/**
 * Aggregate parsed ingredients: group by normalized name, merge quantities and sources.
 */
export function aggregateIngredients(
  parsed: ParsedIngredient[]
): AggregatedIngredient[] {
  const groups = new Map<string, AggregatedIngredient>();

  for (const item of parsed) {
    const key = item.name.toLowerCase().replace(/s$/, ''); // basic singular normalization

    if (groups.has(key)) {
      const existing = groups.get(key)!;
      // Merge quantities
      if (item.quantity) {
        existing.quantity = existing.quantity
          ? `${existing.quantity} + ${item.quantity}`
          : item.quantity;
      }
      if (!existing.recipeIds.includes(item.recipeId)) {
        existing.recipeIds.push(item.recipeId);
        existing.recipeNames.push(item.recipeName);
      }
      existing.originalTexts.push(item.originalText);
    } else {
      groups.set(key, {
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        recipeIds: [item.recipeId],
        recipeNames: [item.recipeName],
        originalTexts: [item.originalText],
      });
    }
  }

  return Array.from(groups.values());
}
