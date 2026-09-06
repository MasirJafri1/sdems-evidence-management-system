export interface MockAuditEvent {
  id: string;
  sequence: number;
  timestamp: string;
  eventType: string;
  actor: string;
  organization: string;
  caseNumber: string;
  eventHash: string;
  previousHash: string;
  integrity: 'VALID' | 'BROKEN' | 'COMPROMISED' | 'BLOCKED';
  metadata?: Record<string, any> | null;
}

export const INITIAL_AUDIT_LOGS: MockAuditEvent[] = [];

