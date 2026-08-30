import { apiClient } from '../../../config/axios.config';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    organizationId?: string | null;
  };
}

export const loginApi = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
  return response.data;
};
