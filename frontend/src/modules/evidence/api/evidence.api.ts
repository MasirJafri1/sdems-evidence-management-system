import { apiClient } from '../../../config/axios.config';

export interface EvidenceApiRecord {
  id: string;
  evidenceNumber: string;
  caseId: string;
  title: string;
  evidenceType?: string;
  serialNumber?: string;
  description?: string;
  status: string;
  currentCustodianId?: string;
  storageLocation?: string;
  createdAt: string;
  case?: {
    id: string;
    caseNumber: string;
    title: string;
  };
  documentVersion?: any;
  currentCustodian?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CustodyEventRecord {
  id: string;
  sequence: number;
  eventType: string;
  actorName: string;
  organizationName: string;
  location: string;
  timestamp: string;
  transferId?: string;
  eventHash: string;
  verified: boolean;
}

export const getEvidenceListApi = async (): Promise<EvidenceApiRecord[]> => {
  const response = await apiClient.get<EvidenceApiRecord[]>('/evidence');
  return response.data;
};

export const getEvidenceByCaseApi = async (caseId: string): Promise<EvidenceApiRecord[]> => {
  const response = await apiClient.get<EvidenceApiRecord[]>(`/cases/${caseId}/evidence`);
  return response.data;
};

export const createEvidenceApi = async (data: {
  caseId: string;
  title: string;
  evidenceType: string;
  serialNumber: string;
  storageLocation: string;
}): Promise<EvidenceApiRecord> => {
  const evidenceNumber = `EVID-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const description = `Type: ${data.evidenceType} | Serial: ${data.serialNumber} | Location: ${data.storageLocation}`;
  
  const response = await apiClient.post<EvidenceApiRecord>('/evidence', {
    caseId: data.caseId,
    evidenceNumber,
    title: data.title,
    description,
  });
  return response.data;
};

export const getEvidenceByIdApi = async (evidenceId: string): Promise<any> => {
  const response = await apiClient.get<any>(`/evidence/${evidenceId}`);
  return response.data.evidence;
};

export const initiateTransferApi = async (
  evidenceId: string,
  data: { toUserId: string; toOrganizationId: string; reason: string }
) => {
  const response = await apiClient.post(`/evidence/${evidenceId}/transfers`, data);
  return response.data;
};

export const acceptTransferApi = async (transferId: string) => {
  const response = await apiClient.post(`/transfers/${transferId}/accept`);
  return response.data;
};

export const rejectTransferApi = async (transferId: string, reason: string) => {
  const response = await apiClient.post(`/transfers/${transferId}/reject`, { rejectionReason: reason });
  return response.data;
};

export const getMyTransfersApi = async () => {
  const response = await apiClient.get('/transfers');
  return response.data;
};

export const getCustodyHistoryApi = async (evidenceId: string): Promise<CustodyEventRecord[]> => {
  const response = await apiClient.get<any>(`/evidence/${evidenceId}/custody-history`);
  return response.data.history;
};

export const verifyCustodyHistoryApi = async (evidenceId: string): Promise<{ valid: boolean }> => {
  const response = await apiClient.get<{ valid: boolean }>(`/evidence/${evidenceId}/custody-history/verify`);
  return response.data;
};
