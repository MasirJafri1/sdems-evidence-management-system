export interface MockCase {
  id: string;
  caseNumber: string;
  referenceNumber: string;
  title: string;
  description: string;
  caseType: string;
  status: 'Active' | 'Under Review' | 'Pending Verification' | 'Closed' | 'Archived';
  organization: string;
  leadOfficer: string;
  officerEmail: string;
  evidenceCount: number;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_CASES: MockCase[] = [];

