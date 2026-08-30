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

export const INITIAL_EVIDENCE: MockEvidence[] = [
  {
    id: 'ev-001',
    evidenceNumber: 'EVID-2026-9041',
    caseId: 'case-001',
    caseNumber: 'CASE-2026-00421',
    title: 'Seized Dell Latitude Forensic Workstation',
    evidenceType: 'Laptop',
    serialNumber: 'DELL-SN-89410A',
    status: 'In Custody',
    currentCustodian: 'Senior Inspector Rajesh Sharma',
    custodianOrganization: 'Central Bureau of Investigation',
    storageLocation: 'CFSL Evidence Locker 4B',
    dateCollected: '2026-08-13T10:00:00Z',
    collectedBy: 'Sub-Inspector Anil Kumar',
    custodyChainStatus: 'CUSTODY CHAIN VALID',
    history: [
      {
        id: 'cust-01',
        sequence: 1,
        eventType: 'Evidence Collected & Seized',
        actor: 'Sub-Inspector Anil Kumar',
        organization: 'Central Bureau of Investigation',
        location: 'Cyber Complex Building Floor 3',
        timestamp: '2026-08-13T10:00:00Z',
        transferId: 'TRF-001',
        eventHash: 'a8912e74c102941b80d4f1992e10411',
        verified: true,
      },
      {
        id: 'cust-02',
        sequence: 2,
        eventType: 'Transferred to Forensic Analyst',
        actor: 'Senior Inspector Rajesh Sharma',
        organization: 'Central Forensic Science Lab',
        location: 'Vault Locker 4B',
        timestamp: '2026-08-15T14:30:00Z',
        transferId: 'TRF-002',
        eventHash: 'b9023f85d213052c91e5f2003f20522',
        verified: true,
      },
    ],
  },
];
