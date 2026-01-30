import Anthropic from '@anthropic-ai/sdk';
import { IRecipe } from '../models/recipe';
import Plan from '../models/plan';

interface AISuggestionInput {
  recipes: IRecipe[];
  nonSkippedDates: { date: string; dayName: string }[];
  userId: string;
}

/**
 * Use Claude API to pick recipes for the week, optimizing for
 * cuisine diversity, complementary pairings, and least-recently-used preference.
 * Returns a map of date -> recipe ID, or null if the call fails.
 */
export async function getAISuggestions(
  input: AISuggestionInput
): Promise<Map<string, string> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    // Get recent plan history (last 14 days) for context
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];

    const recentPlans = await Plan.find({
      userId: input.userId,
      date: { $gte: fourteenDaysAgoStr },
      recipeId: { $exists: true },
    })
      .populate('recipeId', 'title tags')
      .sort({ date: -1 })
      .lean();

    const recentHistory = recentPlans
      .filter((p: any) => p.recipeId)
      .map((p: any) => `${p.date}: ${(p.recipeId as any).title} [${((p.recipeId as any).tags || []).join(', ')}]`)
      .join('\n');

    // Build compact recipe list for the prompt
    const recipeList = input.recipes.slice(0, 50).map((r) => ({
      id: r._id.toString(),
      title: r.title,
      tags: r.tags || [],
      complexity: (r as any).complexity || 'medium',
      lastUsed: r.lastUsedDate
        ? new Date(r.lastUsedDate).toISOString().split('T')[0]
        : 'never',
      recentPlanCount: (r as any).recentPlanCount ?? 0,
    }));

    const daysNeeded = input.nonSkippedDates
      .map((d) => `${d.dayName} (${d.date})`)
      .join(', ');

    const prompt = `You are a meal planning assistant. Pick recipes for each day from the provided list.

DAYS TO FILL: ${daysNeeded}

AVAILABLE RECIPES (JSON):
${JSON.stringify(recipeList, null, 0)}

RECENT MEAL HISTORY (last 14 days):
${recentHistory || 'None'}

RULES:
- Pick one recipe per day from the list above. Use each recipe at most once.
- Prefer recipes with lower recentPlanCount and older/no lastUsed date.
- Ensure cuisine diversity (check tags — avoid 3+ same-cuisine in a row).
- Pair complementary meals (light after heavy, vary complexity across the week).

Respond with ONLY a JSON array like: [{"date":"YYYY-MM-DD","recipeId":"..."}]
No explanation, no markdown fences.`;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    // Parse response
    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed: { date: string; recipeId: string }[] = JSON.parse(text.trim());

    // Validate that all recipe IDs exist in our input list
    const validIds = new Set(input.recipes.map((r) => r._id.toString()));
    const result = new Map<string, string>();
    for (const item of parsed) {
      if (validIds.has(item.recipeId)) {
        result.set(item.date, item.recipeId);
      }
    }

    return result.size > 0 ? result : null;
  } catch (error) {
    console.error('AI suggestion service error (falling back to heuristic):', error);
    return null;
  }
}
