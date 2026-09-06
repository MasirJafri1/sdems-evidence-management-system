import { apiClient } from '../../../config/axios.config';

export interface DocumentApiRecord {
  id: string;
  caseId: string;
  documentName?: string;
  title?: string;
  documentType: string;
  version?: string;
  fileSize?: string;
  sha256Hash?: string;
  blockchainAnchorId?: string;
  transactionHash?: string;
  blockNumber?: number;
  anchoredTimestamp?: string;
  createdAt: string;
}

export const getDocumentsByCaseApi = async (caseId: string): Promise<DocumentApiRecord[]> => {
  const response = await apiClient.get<DocumentApiRecord[]>(`/cases/${caseId}/documents`);
  return response.data;
};

export const listOrganizationDocumentsApi = async (): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/documents');
  return response.data;
};

export const getDocumentByIdApi = async (documentId: string): Promise<DocumentApiRecord> => {
  const response = await apiClient.get<DocumentApiRecord>(`/documents/${documentId}`);
  return response.data;
};

export const uploadDocumentApi = async (
  caseId: string,
  file: File,
  documentType: string,
  title?: string,
  description?: string
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title || file.name);
  formData.append('documentType', documentType);
  if (description) {
    formData.append('description', description);
  }

  const response = await apiClient.post(`/cases/${caseId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const downloadDocumentVersionApi = (documentId: string, versionNumber: string): string => {
  return `${apiClient.defaults.baseURL}/documents/${documentId}/versions/${versionNumber}/download`;
};
