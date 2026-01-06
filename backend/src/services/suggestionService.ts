import mongoose from 'mongoose';
import Recipe, { IRecipe } from '../models/recipe';
import Plan from '../models/plan';

export interface SuggestionConstraints {
  startDate: string; // YYYY-MM-DD
  daysToSkip: number[]; // [0=Mon, 1=Tue, ..., 6=Sun] - indices of days to skip
  avoidRepeats: boolean;
  preferSimple: boolean;
  vegetarianOnly: boolean;
}

export interface DaySuggestion {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Mon, 1=Tue, ..., 6=Sun
  dayName: string;
  recipeId?: string;
  recipe?: IRecipe;
  label?: string; // "Eating Out" for skipped days
  isSkipped: boolean;
}

/**
 * Generate a week of meal suggestions based on constraints
 */
export const generateWeekSuggestions = async (
  constraints: SuggestionConstraints,
  userId: string
): Promise<DaySuggestion[]> => {
  const { startDate, daysToSkip, avoidRepeats, preferSimple, vegetarianOnly } = constraints;

  // Build the 7-day date range
  const suggestions: DaySuggestion[] = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (let i = 0; i < 7; i++) {
    // Parse startDate string safely to avoid timezone shifts
    const [year, month, day] = startDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + i);

    // Convert back to string in local timezone
    const dateYear = date.getFullYear();
    const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
    const dateDay = String(date.getDate()).padStart(2, '0');
    const dateStr = `${dateYear}-${dateMonth}-${dateDay}`;

    const dayOfWeek = i; // 0=Mon for our purposes (startDate is Monday)

    if (daysToSkip.includes(dayOfWeek)) {
      suggestions.push({
        date: dateStr,
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        label: 'Eating Out',
        isSkipped: true,
      });
    } else {
      suggestions.push({
        date: dateStr,
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        isSkipped: false,
      });
    }
  }

  // Get eligible recipes for this user
  const eligibleRecipes = await getEligibleRecipes(constraints, userId);

  if (eligibleRecipes.length === 0) {
    return suggestions; // Return with no recipes if none available
  }

  // Shuffle recipes for randomness
  const shuffledRecipes = shuffleArray([...eligibleRecipes]);

  // Assign recipes to non-skipped days
  let recipeIndex = 0;
  for (const suggestion of suggestions) {
    if (!suggestion.isSkipped && recipeIndex < shuffledRecipes.length) {
      const recipe = shuffledRecipes[recipeIndex];
      suggestion.recipeId = recipe._id.toString();
      suggestion.recipe = recipe;
      recipeIndex++;
    }
  }

  return suggestions;
};

/**
 * Get a single alternative suggestion for a specific date
 */
export const getAlternativeSuggestion = async (
  date: string,
  excludeRecipeIds: string[],
  constraints: Omit<SuggestionConstraints, 'startDate' | 'daysToSkip'>,
  userId: string
): Promise<IRecipe | null> => {
  const { avoidRepeats, preferSimple, vegetarianOnly } = constraints;

  // Build query - filter by userId
  const query: any = { userId };

  // Exclude specified recipes
  if (excludeRecipeIds.length > 0) {
    query._id = { $nin: excludeRecipeIds };
  }

  // Apply vegetarian filter
  if (vegetarianOnly) {
    query.isVegetarian = true;
  }

  // Apply repeat avoidance
  if (avoidRepeats) {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    query.$or = [
      { lastUsedDate: { $lt: tenDaysAgo } },
      { lastUsedDate: { $exists: false } },
      { lastUsedDate: null },
    ];
  }

  // Build sort
  const sort: any = {};
  if (preferSimple) {
    // Sort by complexity: simple first, then medium, then complex
    sort.complexity = 1;
  }
  // Add some randomness by sorting by updatedAt as secondary
  sort.updatedAt = -1;

  const recipes = await Recipe.find(query).sort(sort).limit(10);

  if (recipes.length === 0) {
    return null;
  }

  // Return a random one from the top results for variety
  const randomIndex = Math.floor(Math.random() * Math.min(recipes.length, 5));
  return recipes[randomIndex];
};

/**
 * Get recipes eligible for suggestions based on constraints
 */
async function getEligibleRecipes(
  constraints: SuggestionConstraints,
  userId: string
): Promise<IRecipe[]> {
  const { avoidRepeats, preferSimple, vegetarianOnly } = constraints;

  // Build query - filter by userId
  const query: any = { userId };

  // Apply vegetarian filter
  if (vegetarianOnly) {
    query.isVegetarian = true;
  }

  // Apply repeat avoidance - exclude recipes used in last 10 days
  if (avoidRepeats) {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    query.$or = [
      { lastUsedDate: { $lt: tenDaysAgo } },
      { lastUsedDate: { $exists: false } },
      { lastUsedDate: null },
    ];
  }

  // Build sort
  const sort: any = {};
  if (preferSimple) {
    // Sort by complexity: simple=1, medium=2, complex=3
    // MongoDB string sort: 'complex' < 'medium' < 'simple' alphabetically...
    // We need a different approach - use aggregation or manual sort
    sort.complexity = 1; // This won't work perfectly, we'll handle in memory
  }
  sort.lastUsedDate = 1; // Prefer least recently used

  let recipes = await Recipe.find(query).sort(sort);

  // If preferSimple, sort in memory to get correct order
  if (preferSimple) {
    const complexityOrder = { simple: 0, medium: 1, complex: 2, undefined: 3 };
    recipes = recipes.sort((a, b) => {
      const aOrder = complexityOrder[a.complexity as keyof typeof complexityOrder] ?? 3;
      const bOrder = complexityOrder[b.complexity as keyof typeof complexityOrder] ?? 3;
      return aOrder - bOrder;
    });
  }

  return recipes;
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Update a recipe's lastUsedDate when it's planned
 */
export const markRecipeAsUsed = async (recipeId: string, date: string): Promise<void> => {
  await Recipe.findByIdAndUpdate(recipeId, { lastUsedDate: new Date(date) });
};

/**
 * Batch update multiple recipes' lastUsedDate
 */
export const markRecipesAsUsed = async (
  updates: { recipeId: string; date: string }[]
): Promise<void> => {
  // Use Promise.all with findByIdAndUpdate instead of bulkWrite for simpler typing
  await Promise.all(
    updates.map(({ recipeId, date }) =>
      Recipe.findByIdAndUpdate(recipeId, { lastUsedDate: new Date(date) })
    )
  );
};
