import mongoose from 'mongoose';
import Recipe, { IRecipe } from '../models/recipe';
import Plan from '../models/plan';

export interface SuggestionConstraints {
  startDate: string; // YYYY-MM-DD
  daysToSkip: number[]; // [0=Mon, 1=Tue, ..., 6=Sun] - indices of days to skip
  avoidRepeats: boolean;
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
  const { startDate, daysToSkip, avoidRepeats, vegetarianOnly } = constraints;

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

  // Assign recipes to non-skipped days (cycle through if pool is smaller than days)
  let recipeIndex = 0;
  for (const suggestion of suggestions) {
    if (!suggestion.isSkipped && shuffledRecipes.length > 0) {
      const recipe = shuffledRecipes[recipeIndex % shuffledRecipes.length];
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
  const { avoidRepeats, vegetarianOnly } = constraints;

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

  // Apply repeat avoidance with adaptive lookback window
  if (avoidRepeats) {
    // Get total recipe count for adaptive lookback
    const totalRecipes = await Recipe.countDocuments({ userId });
    // Adaptive lookback: shorter window for smaller collections
    // Min 3 days, max 10 days, scales with collection size
    const lookbackDays = Math.min(10, Math.max(3, Math.floor(totalRecipes / 2)));

    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);
    query.$or = [
      { lastUsedDate: { $lt: lookbackDate } },
      { lastUsedDate: { $exists: false } },
      { lastUsedDate: null },
    ];
  }

  // Build sort
  const sort: any = {};
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
  const { avoidRepeats, vegetarianOnly } = constraints;

  // Build query - filter by userId
  const query: any = { userId };

  // Apply vegetarian filter
  if (vegetarianOnly) {
    query.isVegetarian = true;
  }

  // Apply repeat avoidance with adaptive lookback window
  if (avoidRepeats) {
    // Get total recipe count for adaptive lookback
    const totalRecipes = await Recipe.countDocuments({ userId });
    // Adaptive lookback: shorter window for smaller collections
    // Min 3 days, max 10 days, scales with collection size
    const lookbackDays = Math.min(10, Math.max(3, Math.floor(totalRecipes / 2)));

    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);
    query.$or = [
      { lastUsedDate: { $lt: lookbackDate } },
      { lastUsedDate: { $exists: false } },
      { lastUsedDate: null },
    ];
  }

  // Build sort
  const sort: any = {};
  sort.lastUsedDate = 1; // Prefer least recently used

  let recipes = await Recipe.find(query).sort(sort);

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
