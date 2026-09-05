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

export const INITIAL_AUDIT_LOGS: MockAuditEvent[] = [];

