export interface MockUser {
  id: string;
  name: string;
  email: string;
  designation: string;
  organization: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  permissionsCount: number;
  lastLogin: string;
}

export interface MockPermissionRule {
  id: string;
  permissionName: 'CASE_VIEW' | 'CASE_CREATE' | 'DOCUMENT_VIEW' | 'DOCUMENT_UPLOAD' | 'DOCUMENT_DOWNLOAD' | 'EVIDENCE_VIEW' | 'EVIDENCE_REGISTER' | 'CUSTODY_TRANSFER' | 'AUDIT_VIEW' | 'BLOCKCHAIN_VERIFY';
  description: string;
  effect: 'ALLOW' | 'DENY' | 'INHERITED';
  scope: string;
}

export const INITIAL_USERS: MockUser[] = [];


export const INITIAL_PERMISSIONS: MockPermissionRule[] = [
  { id: 'p1', permissionName: 'CASE_VIEW', description: 'View assigned case file records and metadata', effect: 'ALLOW', scope: 'Assigned Cases' },
  { id: 'p2', permissionName: 'CASE_CREATE', description: 'Initialize new official investigative case file', effect: 'ALLOW', scope: 'Organization' },
  { id: 'p3', permissionName: 'DOCUMENT_VIEW', description: 'View digital forensic document metadata and history', effect: 'ALLOW', scope: 'Assigned Cases' },
  { id: 'p4', permissionName: 'DOCUMENT_UPLOAD', description: 'Upload binary file versions and compute SHA-256', effect: 'ALLOW', scope: 'Assigned Cases' },
  { id: 'p5', permissionName: 'DOCUMENT_DOWNLOAD', description: 'Stream or download raw forensic document binaries', effect: 'ALLOW', scope: 'Assigned Cases' },
  { id: 'p6', permissionName: 'EVIDENCE_VIEW', description: 'Inspect physical evidence registry items', effect: 'ALLOW', scope: 'Assigned Cases' },
  { id: 'p7', permissionName: 'EVIDENCE_REGISTER', description: 'Register new seized physical evidence item', effect: 'ALLOW', scope: 'Assigned Cases' },
  { id: 'p8', permissionName: 'CUSTODY_TRANSFER', description: 'Initiate and accept physical custody transfers', effect: 'ALLOW', scope: 'Assigned Custodian' },
  { id: 'p9', permissionName: 'AUDIT_VIEW', description: 'Inspect append-only sequence audit hash logs', effect: 'ALLOW', scope: 'Organization' },
  { id: 'p10', permissionName: 'BLOCKCHAIN_VERIFY', description: 'Execute independent cryptographic blockchain proof verification', effect: 'ALLOW', scope: 'Public / All' },
];
