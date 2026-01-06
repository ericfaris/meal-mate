import { apiClient, API_ENDPOINTS } from '../../config/api';
import { Recipe, SuggestionConstraints, Plan } from '../../types';

export interface DaySuggestion {
  date: string;
  dayOfWeek: number;
  dayName: string;
  recipeId?: string;
  recipe?: Recipe;
  label?: string;
  isSkipped: boolean;
}

export interface ApproveSuggestionsResponse {
  message: string;
  plans: Plan[];
}

export const suggestionApi = {
  /**
   * Generate a week of meal suggestions based on constraints
   */
  generateSuggestions: async (constraints: SuggestionConstraints): Promise<DaySuggestion[]> => {
    const response = await apiClient.post(`${API_ENDPOINTS.suggestions}/generate`, constraints);
    return response.data;
  },

  /**
   * Get an alternative recipe for a specific date
   */
  getAlternative: async (
    date: string,
    excludeRecipeIds: string[],
    constraints: Omit<SuggestionConstraints, 'startDate' | 'daysToSkip'>
  ): Promise<Recipe> => {
    const response = await apiClient.post(`${API_ENDPOINTS.suggestions}/alternative`, {
      date,
      excludeRecipeIds,
      ...constraints,
    });
    return response.data;
  },

  /**
   * Approve and save suggestions as confirmed plans
   */
  approveSuggestions: async (suggestions: DaySuggestion[]): Promise<ApproveSuggestionsResponse> => {
    const response = await apiClient.post(`${API_ENDPOINTS.suggestions}/approve`, {
      suggestions,
    });
    return response.data;
  },
};
