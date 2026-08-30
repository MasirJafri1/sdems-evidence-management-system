export interface MockAuditEvent {
  id: string;
  sequence: number;
  timestamp: string;
  eventType: 'Case Created' | 'Document Uploaded' | 'Document Version Created' | 'Evidence Registered' | 'Custody Transfer Initiated' | 'Custody Transfer Accepted' | 'Permission Granted' | 'Permission Denied' | 'Blockchain Anchor Created';
  actor: string;
  organization: string;
  caseNumber: string;
  eventHash: string;
  previousHash: string;
  integrity: 'VALID' | 'BROKEN';
}

export const INITIAL_AUDIT_LOGS: MockAuditEvent[] = [
  {
    id: 'aud-001',
    sequence: 1,
    timestamp: '2026-08-12T09:30:00Z',
    eventType: 'Case Created',
    actor: 'Senior Inspector Rajesh Sharma',
    organization: 'Central Bureau of Investigation',
    caseNumber: 'CASE-2026-00421',
    eventHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    integrity: 'VALID',
  },
  {
    id: 'aud-002',
    sequence: 2,
    timestamp: '2026-08-13T10:00:00Z',
    eventType: 'Evidence Registered',
    actor: 'Sub-Inspector Anil Kumar',
    organization: 'Central Bureau of Investigation',
    caseNumber: 'CASE-2026-00421',
    eventHash: '8912e74c102941b80d4f1992e10411a8912e74c102941b80d4f1992e10411a89',
    previousHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    integrity: 'VALID',
  },
  {
    id: 'aud-003',
    sequence: 3,
    timestamp: '2026-08-25T11:32:15Z',
    eventType: 'Blockchain Anchor Created',
    actor: 'SDEMS System Engine',
    organization: 'Ministry of Home Affairs Digital Systems',
    caseNumber: 'CASE-2026-00421',
    eventHash: '3a91c841e009141f22b7811904a29c661d9940223a91c841e009141f22b78119',
    previousHash: '8912e74c102941b80d4f1992e10411a8912e74c102941b80d4f1992e10411a89',
    integrity: 'VALID',
  },
];
