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
        category: guessCategory(name, quantity),
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
export function parseIngredientLine(line: string): { name: string; quantity: string } {
  // Remove leading list markers ("- ", "• ", "1. ", "2) ") but never the
  // quantity itself: "2 lb chicken" must keep its 2. (Regression: the old
  // pattern stripped every leading digit, so quantities were lost.)
  const cleaned = line.replace(/^\s*(?:[-*\u2022]+\s*|\d+[.)]\s+)/, '').trim();

  // Match quantity pattern: number (with optional fraction) + optional unit
  const match = cleaned.match(
    /^(\d+(?:\.\d+)?(?:\s+\d+\/\d+|\/\d+)?(?:\s*[-–]\s*[\d\/\.]+)?)\s*(cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|liters?|quarts?|pints?|gallons?|cans?|packages?|bags?|bunche?s?|cloves?|stalks?|heads?|slices?|pieces?|sticks?|sprigs?|wedges?|jars?|box(?:es)?|bottles?|containers?|blocks?)?\s*(?:of\s+)?(.*)/i
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
export function guessCategory(name: string, quantity = ''): ParsedIngredient['category'] {
  const lower = name.toLowerCase();

  // Container/processing words beat the ingredient: "frozen peas" is Frozen,
  // "crushed tomatoes" from a can and "beef broth" are Pantry.
  if (/\bfrozen\b/.test(lower)) return 'Frozen';
  if (/\bcans?\b|\bjars?\b/i.test(quantity) ||
      /\b(canned|broth|stock|paste|sauce|powder|seasoning|dried|ground (cumin|cinnamon|ginger|pepper))\b/.test(lower)) {
    return 'Pantry';
  }

  const produce = ['onion', 'garlic', 'tomato', 'pepper', 'lettuce', 'carrot', 'potato', 'celery',
    'broccoli', 'spinach', 'mushroom', 'zucchini', 'cucumber', 'avocado', 'lemon', 'lime',
    'apple', 'banana', 'berry', 'cilantro', 'parsley', 'basil', 'ginger', 'jalape', 'corn',
    'bean sprout', 'cabbage', 'kale', 'arugula', 'scallion', 'shallot', 'squash', 'pea'];

  const meat = ['chicken', 'beef', 'pork', 'turkey', 'bacon', 'sausage', 'ham', 'steak',
    'ground', 'chuck', 'roast', 'brisket', 'salmon', 'shrimp', 'fish', 'tuna', 'lamb', 'crab', 'lobster', 'meat'];

  const dairy = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'sour cream',
    'mozzarella', 'parmesan', 'cheddar', 'ricotta', 'whipping cream'];

  const bakery = ['bread', 'roll', 'tortilla', 'bun', 'pita', 'naan', 'baguette', 'croissant'];

  const frozen = ['frozen'];

  if (dairy.some((k) => lower.includes(k))) return 'Dairy & Eggs';
  if (meat.some((k) => lower.includes(k))) return 'Meat & Seafood';
  if (produce.some((k) => lower.includes(k))) return 'Produce';
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
      // Merge quantities: "1" + "2" -> "3", "1 lb" + "1/2 lb" -> "1 1/2 lb";
      // mismatched units stay readable as "1 lb + 2 cups".
      if (item.quantity) {
        existing.quantity = existing.quantity
          ? mergeQuantities(existing.quantity, item.quantity)
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

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2, '¼': 1 / 4, '¾': 3 / 4, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 1 / 8,
};

const UNIT_ALIASES: Record<string, string> = {
  lbs: 'lb', pound: 'lb', pounds: 'lb', cups: 'cup', tablespoon: 'tbsp', tablespoons: 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp', ounce: 'oz', ounces: 'oz', cans: 'can', cloves: 'clove',
  bags: 'bag', packages: 'package', bunches: 'bunch', heads: 'head', stalks: 'stalk',
  slices: 'slice', pieces: 'piece', sticks: 'stick', sprigs: 'sprig', grams: 'g', gram: 'g',
};

/** "1 1/2 cups" -> { amount: 1.5, unit: 'cup' }; null when it isn't a plain amount. */
export function parseQuantity(q: string): { amount: number; unit: string } | null {
  const m = q.trim().match(/^((?:\d+(?:\.\d+)?)?\s*(?:\d+\/\d+|[½¼¾⅓⅔⅛])?)\s*([a-zA-Z]*)\.?$/);
  if (!m || !m[1].trim()) return null;
  let amount = 0;
  for (const part of m[1].trim().split(/\s+/)) {
    if (UNICODE_FRACTIONS[part] !== undefined) amount += UNICODE_FRACTIONS[part];
    else if (/^\d+\/\d+$/.test(part)) {
      const [n, d] = part.split('/').map(Number);
      if (!d) return null;
      amount += n / d;
    } else if (/^\d+(?:\.\d+)?[½¼¾⅓⅔⅛]$/.test(part)) {
      amount += Number(part.slice(0, -1)) + UNICODE_FRACTIONS[part.slice(-1)];
    } else if (/^\d+(?:\.\d+)?$/.test(part)) amount += Number(part);
    else return null;
  }
  const raw = m[2].toLowerCase();
  return { amount, unit: UNIT_ALIASES[raw] || raw };
}

const NICE_FRACTIONS: [number, string][] = [
  [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [1 / 2, '1/2'], [2 / 3, '2/3'], [3 / 4, '3/4'],
];

export function formatAmount(n: number): string {
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  if (frac < 0.01) return String(whole);
  const nice = NICE_FRACTIONS.find(([v]) => Math.abs(v - frac) < 0.02);
  if (nice) return whole ? `${whole} ${nice[1]}` : nice[1];
  return String(Math.round(n * 100) / 100);
}

const COUNT_UNITS = new Set(['cup', 'can', 'clove', 'bag', 'package', 'head', 'stalk', 'slice', 'piece', 'stick', 'sprig']);

function pluralUnit(unit: string, amount: number): string {
  if (amount <= 1) return unit;
  if (unit === 'bunch') return 'bunches';
  return COUNT_UNITS.has(unit) ? `${unit}s` : unit;
}

/** Sum two quantities when they share a unit; otherwise join them with " + ". */
export function mergeQuantities(a: string, b: string): string {
  const parts = a.split(' + ');
  const qb = parseQuantity(b);
  if (qb) {
    for (let i = 0; i < parts.length; i++) {
      const qa = parseQuantity(parts[i]);
      if (qa && qa.unit === qb.unit) {
        const total = qa.amount + qb.amount;
        parts[i] = [formatAmount(total), pluralUnit(qa.unit, total)].filter(Boolean).join(' ');
        return parts.join(' + ');
      }
    }
  }
  return [...parts, b].join(' + ');
}
