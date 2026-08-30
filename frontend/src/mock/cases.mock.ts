export interface MockCase {
  id: string;
  caseNumber: string;
  referenceNumber: string;
  title: string;
  description: string;
  caseType: string;
  priority: 'HIGH' | 'MEDIUM' | 'CRITICAL' | 'STANDARD';
  status: 'Active' | 'Under Review' | 'Pending Verification' | 'Closed' | 'Archived';
  organization: string;
  leadOfficer: string;
  officerEmail: string;
  evidenceCount: number;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_CASES: MockCase[] = [
  {
    id: 'case-001',
    caseNumber: 'CASE-2026-00421',
    referenceNumber: 'CBI/ND/2026/8941',
    title: 'Digital Infrastructure Cybersecurity Breach',
    description: 'Investigation into unauthorized intrusion and forensic disk dump analysis of server clusters.',
    caseType: 'Cyber Crime',
    priority: 'CRITICAL',
    status: 'Active',
    organization: 'Central Bureau of Investigation',
    leadOfficer: 'Senior Inspector Rajesh Sharma',
    officerEmail: 'r.sharma@cbi.gov.in',
    evidenceCount: 14,
    documentCount: 8,
    createdAt: '2026-08-12T09:30:00Z',
    updatedAt: '2026-08-30T10:15:00Z',
  },
  {
    id: 'case-002',
    caseNumber: 'CASE-2026-00388',
    referenceNumber: 'CFSL/DL/2026/4102',
    title: 'Financial Transaction Forensic Ledger Audit',
    description: 'Cryptographic ledger reconstruction and seized mobile device memory extraction.',
    caseType: 'Financial Fraud',
    priority: 'HIGH',
    status: 'Under Review',
    organization: 'Central Forensic Science Laboratory',
    leadOfficer: 'Dr. Sunita Deshmukh',
    officerEmail: 's.deshmukh@cfsl.gov.in',
    evidenceCount: 9,
    documentCount: 12,
    createdAt: '2026-08-01T14:20:00Z',
    updatedAt: '2026-08-28T16:45:00Z',
  },
  {
    id: 'case-003',
    caseNumber: 'CASE-2026-00215',
    referenceNumber: 'HC/DEL/2026/0091',
    title: 'State vs. Cyber Syndicate Trial Evidence',
    description: 'Judicial digital exhibit binder and multi-tenant chain of custody record.',
    caseType: 'Judicial Exhibit',
    priority: 'STANDARD',
    status: 'Pending Verification',
    organization: 'High Court Judicial Registry',
    leadOfficer: 'Registrar V. K. Menon',
    officerEmail: 'vk.menon@highcourt.gov.in',
    evidenceCount: 22,
    documentCount: 19,
    createdAt: '2026-07-15T11:00:00Z',
    updatedAt: '2026-08-29T18:00:00Z',
  },
];
