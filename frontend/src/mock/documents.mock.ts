export interface MockDocument {
  id: string;
  caseId: string;
  caseNumber: string;
  documentName: string;
  title?: string;
  documentType: string;
  version: string;
  uploadedBy: string;
  uploadedDate: string;
  fileSize: string;
  sha256Hash: string;
  blockchainAnchorId: string;
  transactionHash: string;
  blockNumber: number;
  anchoredTimestamp: string;
  blockchainStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
  verificationStatus: 'CONFIRMED' | 'UNVERIFIED';
}

export const INITIAL_DOCUMENTS: MockDocument[] = [];

