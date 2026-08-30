import { apiClient } from '../../../config/axios.config';

export const grantPermissionApi = async (caseId: string, userId: string, permissionId: string, effect: 'GRANT' | 'DENY') => {
  const response = await apiClient.post(`/authorization/cases/${caseId}/permissions`, {
    userId,
    permissionId,
    effect,
  });
  return response.data;
};

export const revokePermissionApi = async (caseId: string, userId: string, permissionId: string) => {
  const response = await apiClient.delete(`/authorization/cases/${caseId}/permissions`, {
    data: { userId, permissionId },
  });
  return response.data;
};

export const checkPermissionApi = async (caseId: string, permission: string): Promise<{ allowed: boolean }> => {
  const response = await apiClient.get<{ allowed: boolean }>(`/authorization/cases/${caseId}/permissions/check`, {
    params: { permission },
  });
  return response.data;
};
