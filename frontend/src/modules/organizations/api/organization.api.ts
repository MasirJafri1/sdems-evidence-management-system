import { apiClient } from '../../../config/axios.config';

export interface UserApiRecord {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  role?: string;
  organization?: string;
}

export const getOrganizationUsersApi = async (organizationId: string): Promise<UserApiRecord[]> => {
  const response = await apiClient.get<UserApiRecord[]>(`/organizations/${organizationId}/users`);
  return response.data;
};

export const getOrganizationsApi = async (): Promise<any[]> => {
  try {
    const response = await apiClient.get('/organizations');
    return response.data;
  } catch (error) {
    return [];
  }
};

export const lookupUserApi = async (query: string): Promise<{ found: boolean; user?: any; message?: string }> => {
  try {
    const response = await apiClient.post('/organizations/users/lookup', { query });
    return response.data;
  } catch (error: any) {
    return {
      found: false,
      message: error.response?.data?.message || 'No registered officer found with that Email or User ID.'
    };
  }
};

export const getAllRegisteredOfficersApi = async (): Promise<Array<{ id: string; name: string; email: string }>> => {

  try {
    const response = await apiClient.get('/organizations/officers/all');
    return response.data;
  } catch (error) {
    return [];
  }
};

export const createOrganizationApi = async (data: {
  name: string;
  code: string;
  description?: string;
  adminType?: 'NEW' | 'EXISTING';
  existingUserId?: string;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
}) => {
  const response = await apiClient.post('/organizations', data);
  return response.data;
};


export const createUserApi = async (
  organizationId: string,
  data: {
    mode?: 'EXISTING' | 'NEW';
    existingUserId?: string;
    name?: string;
    email?: string;
    password?: string;
    roleId?: string;
    roleName?: string;
    permissions?: string[];
  }
): Promise<UserApiRecord> => {
  const response = await apiClient.post<UserApiRecord>(`/organizations/${organizationId}/users`, data);
  return response.data;
};

export const getOrganizationRolesApi = async (
  organizationId: string
): Promise<Array<{ id: string; name: string; description?: string }>> => {
  try {
    const response = await apiClient.get(`/organizations/${organizationId}/roles`);
    return response.data;
  } catch (error) {
    return [];
  }
};

