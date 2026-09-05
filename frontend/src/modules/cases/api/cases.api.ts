import { apiClient } from '../../../config/axios.config';

export interface CaseApiRecord {
  id: string;
  caseNumber: string;
  referenceNumber: string;
  title: string;
  description: string;
  caseType: string;
  status: 'Active' | 'Under Review' | 'Pending Verification' | 'Closed' | 'Archived';
  organizationId: string;
  organization?: {
    id: string;
    name: string;
    code: string;
  };
  participants?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    evidence?: number;
    documents?: number;
  };
}

export const getCasesApi = async (organizationId: string): Promise<CaseApiRecord[]> => {
  const response = await apiClient.get<CaseApiRecord[]>(`/organizations/${organizationId}/cases`);
  return response.data;
};

export const getCaseByIdApi = async (caseId: string): Promise<CaseApiRecord> => {
  const response = await apiClient.get<CaseApiRecord>(`/cases/${caseId}`);
  return response.data;
};

export const createCaseApi = async (
  organizationId: string,
  data: {
    caseNumber: string;
    referenceNumber: string;
    title: string;
    description: string;
    caseType: string;
  }
): Promise<CaseApiRecord> => {
  const response = await apiClient.post<CaseApiRecord>(`/organizations/${organizationId}/cases`, data);
  return response.data;
};
