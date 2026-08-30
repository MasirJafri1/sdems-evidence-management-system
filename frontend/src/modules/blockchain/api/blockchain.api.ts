import { apiClient } from '../../../config/axios.config';

export interface BlockchainAnchorInfo {
  anchorId: string;
  transactionHash: string;
  blockNumber: number;
  anchoredTimestamp: string;
}

export interface VerificationProofResult {
  verified: boolean;
  submittedHash: string;
  anchoredHash: string;
  blockNumber: number;
  transactionHash: string;
}

export const getBlockchainHealthApi = async (): Promise<{ status: string }> => {
  const response = await apiClient.get<{ status: string }>('/blockchain/health');
  return response.data;
};

export const getVersionAnchorApi = async (versionId: string): Promise<BlockchainAnchorInfo> => {
  const response = await apiClient.get<BlockchainAnchorInfo>(`/document-versions/${versionId}/blockchain`);
  return response.data;
};

export const verifyVersionApi = async (versionId: string): Promise<VerificationProofResult> => {
  const response = await apiClient.get<VerificationProofResult>(`/document-versions/${versionId}/verify`);
  return response.data;
};
