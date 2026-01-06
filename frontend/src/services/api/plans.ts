import { apiClient, API_ENDPOINTS } from '../../config/api';
import { Plan, PlanUpdate } from '../../types';

export const planApi = {
  // Get plans for a date range
  getWeekPlans: async (startDate: string, days: number): Promise<Plan[]> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.plans}?start=${startDate}&days=${days}`
    );
    return response.data;
  },

  // Get plan for a specific date
  getByDate: async (date: string): Promise<Plan> => {
    const response = await apiClient.get(`${API_ENDPOINTS.plans}/${date}`);
    return response.data;
  },

  // Update or create plan for a specific date
  updateByDate: async (date: string, data: PlanUpdate): Promise<Plan> => {
    const response = await apiClient.put(`${API_ENDPOINTS.plans}/${date}`, data);
    return response.data;
  },

  // Delete plan for a specific date
  deleteByDate: async (date: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.plans}/${date}`);
  },

  // Delete all plans
  deleteAll: async (): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.plans}`);
  },
};
