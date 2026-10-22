import Recipe from '../models/recipe';
import { generateWeekSuggestions } from '../services/suggestionService';

jest.mock('../models/recipe', () => ({
  __esModule: true,
  default: { aggregate: jest.fn(), countDocuments: jest.fn() },
}));
jest.mock('../services/aiSuggestionService', () => ({ getAISuggestions: jest.fn() }));

const mockRecipe = Recipe as unknown as { aggregate: jest.Mock; countDocuments: jest.Mock };
const userId = '64b000000000000000000001';

/** The $match stage generateWeekSuggestions sent to Recipe.aggregate. */
async function matchFor(constraints: { avoidRepeats: boolean; vegetarianOnly: boolean }) {
  mockRecipe.aggregate.mockResolvedValue([]);
  mockRecipe.countDocuments.mockResolvedValue(12);
  await generateWeekSuggestions({ startDate: '2026-10-19', daysToSkip: [], ...constraints }, userId);
  return mockRecipe.aggregate.mock.calls.at(-1)[0][0].$match;
}

describe('week suggestion constraints', () => {
  beforeEach(() => jest.clearAllMocks());

  it('restricts to vegetarian recipes when vegetarianOnly is set', async () => {
    expect((await matchFor({ avoidRepeats: false, vegetarianOnly: true })).isVegetarian).toBe(true);
  });

  it('excludes recently used recipes when avoidRepeats is set', async () => {
    const match = await matchFor({ avoidRepeats: true, vegetarianOnly: false });
    expect(match.$or).toEqual(expect.arrayContaining([{ lastUsedDate: { $exists: false } }]));
    expect(match.isVegetarian).toBeUndefined();
  });

  it('applies neither filter when both are off', async () => {
    const match = await matchFor({ avoidRepeats: false, vegetarianOnly: false });
    expect(match.isVegetarian).toBeUndefined();
    expect(match.$or).toBeUndefined();
  });
});
