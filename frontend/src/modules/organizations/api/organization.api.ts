import { apiClient } from '../../../config/axios.config';

export interface UserApiRecord {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export const getOrganizationUsersApi = async (organizationId: string): Promise<UserApiRecord[]> => {
  const response = await apiClient.get<UserApiRecord[]>(`/organizations/${organizationId}/users`);
  return response.data;
};

export const createUserApi = async (
  organizationId: string,
  data: { name: string; email: string; password: string; roleId: string }
): Promise<UserApiRecord> => {
  const response = await apiClient.post<UserApiRecord>(`/organizations/${organizationId}/users`, data);
  return response.data;
};
