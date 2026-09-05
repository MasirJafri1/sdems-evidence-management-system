export interface CustodyEvent {
  id: string;
  sequence: number;
  eventType: string;
  actor: string;
  organization: string;
  location: string;
  timestamp: string;
  transferId: string;
  eventHash: string;
  verified: boolean;
}

export interface MockEvidence {
  id: string;
  evidenceNumber: string;
  caseId: string;
  caseNumber: string;
  title: string;
  evidenceType: 'Mobile Device' | 'Laptop' | 'Document' | 'Storage Media' | 'CCTV Recording' | 'Physical Item';
  serialNumber: string;
  status: 'In Custody' | 'Transfer Pending' | 'Transferred' | 'Under Examination' | 'Released' | 'Archived';
  currentCustodian: string;
  custodianOrganization: string;
  storageLocation: string;
  dateCollected: string;
  collectedBy: string;
  custodyChainStatus: 'CUSTODY CHAIN VALID' | 'UNVERIFIED';
  history: CustodyEvent[];
}

export const INITIAL_EVIDENCE: MockEvidence[] = [];

