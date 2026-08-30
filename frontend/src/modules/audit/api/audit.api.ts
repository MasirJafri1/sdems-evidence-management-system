import { apiClient } from '../../../config/axios.config';

export interface AuditRecordApi {
  id: string;
  sequence: number;
  timestamp: string;
  eventType: string;
  actorName: string;
  organizationName: string;
  caseNumber: string;
  eventHash: string;
  previousHash: string;
  integrity: 'VALID' | 'BROKEN';
}

export const getAuditHistoryApi = async (caseId: string): Promise<AuditRecordApi[]> => {
  const response = await apiClient.get<AuditRecordApi[]>(`/cases/${caseId}/audit`);
  return response.data;
};

export const verifyAuditChainApi = async (caseId: string): Promise<{ valid: boolean }> => {
  const response = await apiClient.get<{ valid: boolean }>(`/cases/${caseId}/audit/verify`);
  return response.data;
};
