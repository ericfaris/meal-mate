import { apiClient, API_ENDPOINTS } from '../../config/api';
import { Household, CreateHouseholdRequest, JoinHouseholdRequest } from '../../types';

export const householdApi = {
  // Get household details
  getHousehold: async (): Promise<Household> => {
    const response = await apiClient.get(API_ENDPOINTS.households);
    return response.data.household;
  },

  // Create a new household
  createHousehold: async (data: CreateHouseholdRequest): Promise<Household> => {
    const response = await apiClient.post(API_ENDPOINTS.households, data);
    return response.data.household;
  },

  // Join household via invitation token
  joinHousehold: async (data: JoinHouseholdRequest): Promise<{ message: string }> => {
    const response = await apiClient.post(`${API_ENDPOINTS.households}/join`, data);
    return response.data;
  },

  // Generate invitation link
  generateInvite: async (): Promise<{ inviteUrl: string }> => {
    const response = await apiClient.post(`${API_ENDPOINTS.households}/invite`);
    return response.data;
  },

  // Leave household
  leaveHousehold: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete(`${API_ENDPOINTS.households}/leave`);
    return response.data;
  },

  // Delete household (admin only)
  deleteHousehold: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete(API_ENDPOINTS.households);
    return response.data;
  },
};