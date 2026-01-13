import { apiClient, API_ENDPOINTS } from '../../config/api';
import { RecipeSubmission, SubmitRecipeRequest, ReviewSubmissionRequest } from '../../types';

export const submissionApi = {
  // Submit a recipe URL for approval
  submitRecipe: async (data: SubmitRecipeRequest): Promise<RecipeSubmission> => {
    const response = await apiClient.post(API_ENDPOINTS.submissions, data);
    return response.data.submission;
  },

  // Get pending submissions (admin only)
  getPendingSubmissions: async (): Promise<RecipeSubmission[]> => {
    const response = await apiClient.get(API_ENDPOINTS.submissions);
    return response.data.submissions;
  },

  // Review a submission (admin only)
  reviewSubmission: async (
    submissionId: string,
    data: ReviewSubmissionRequest
  ): Promise<RecipeSubmission> => {
    const response = await apiClient.post(
      `${API_ENDPOINTS.submissions}/${submissionId}/review`,
      data
    );
    return response.data.submission;
  },
};