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
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
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

export const addCaseParticipantApi = async (
  caseId: string,
  data: {
    userId: string;
    isCaseAdmin?: boolean;
    permissions?: string[];
  }
) => {
  const response = await apiClient.post(`/cases/${caseId}/participants`, data);
  return response.data;
};

export const getCaseParticipantsApi = async (caseId: string) => {
  const response = await apiClient.get(`/cases/${caseId}/participants`);
  return response.data;
};

// ----------------------------------------------------------------------------
// EXTERNAL CASE ACCESS
// ----------------------------------------------------------------------------

export const requestCaseAccessApi = async (caseNumber: string, reason?: string) => {
  const response = await apiClient.post('/cases/access-requests', { caseNumber, reason });
  return response.data;
};

export const verifyCaseApi = async (caseNumber: string): Promise<{ valid: boolean, caseId?: string, title?: string }> => {
  const response = await apiClient.get(`/cases/verify/${caseNumber}`);
  return response.data;
};

export const listCaseAccessRequestsApi = async (caseId?: string) => {
  const url = caseId ? `/cases/${caseId}/access-requests` : `/cases/access-requests`;
  const response = await apiClient.get(url);
  return response.data;
};

export const resolveCaseAccessRequestApi = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
  const response = await apiClient.post(`/cases/access-requests/${requestId}/resolve`, { action });
  return response.data;
};
