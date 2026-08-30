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

export const INITIAL_DOCUMENTS: MockDocument[] = [
  {
    id: 'doc-001',
    caseId: 'case-001',
    caseNumber: 'CASE-2026-00421',
    documentName: 'Forensic_Disk_Dump_Analysis_Report.pdf',
    documentType: 'Forensic Report',
    version: '1.2',
    uploadedBy: 'Senior Inspector Rajesh Sharma',
    uploadedDate: '2026-08-25T11:30:00Z',
    fileSize: '4.8 MB',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    blockchainAnchorId: 'ANCHOR-0x98124A',
    transactionHash: '0x8f3c71a9e22b04f128c66e99411d35501bc89f2a',
    blockNumber: 3120491,
    anchoredTimestamp: '2026-08-25T11:32:15Z',
    blockchainStatus: 'VERIFIED',
    verificationStatus: 'CONFIRMED',
  },
  {
    id: 'doc-002',
    caseId: 'case-001',
    caseNumber: 'CASE-2026-00421',
    documentName: 'Network_Packet_Capture_Audit.log',
    documentType: 'Audit Log',
    version: '1.0',
    uploadedBy: 'Analyst Vikram Verma',
    uploadedDate: '2026-08-22T08:15:00Z',
    fileSize: '12.4 MB',
    sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    blockchainAnchorId: 'ANCHOR-0x7411BC',
    transactionHash: '0x3a91c841e009141f22b7811904a29c661d994022',
    blockNumber: 3118920,
    anchoredTimestamp: '2026-08-22T08:16:40Z',
    blockchainStatus: 'VERIFIED',
    verificationStatus: 'CONFIRMED',
  },
];
