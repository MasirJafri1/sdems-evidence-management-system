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
  permissionName: string;
  description: string;
  effect: 'ALLOW' | 'DENY' | 'INHERITED';
  scope: string;
}

export const INITIAL_USERS: MockUser[] = [];

export const INITIAL_PERMISSIONS: MockPermissionRule[] = [
  // Cases Operations
  { id: 'p1', permissionName: 'CASE_CREATE', description: 'Create Case Containers', effect: 'ALLOW', scope: 'Organization Setting' },
  { id: 'p2', permissionName: 'CASE_READ', description: 'Read Case Records', effect: 'ALLOW', scope: 'Org-Wide / Container' },
  { id: 'p3', permissionName: 'CASE_UPDATE', description: 'Update Case Metadata', effect: 'ALLOW', scope: 'Org-Wide / Container' },
  { id: 'p4', permissionName: 'CASE_PARTICIPANT_MANAGE', description: 'Manage Case Participants', effect: 'ALLOW', scope: 'Org-Wide / Container' },

  // Documents Operations
  { id: 'p5', permissionName: 'DOCUMENT_UPLOAD', description: 'Upload Evidence Documents', effect: 'ALLOW', scope: 'Org-Wide / Container' },
  { id: 'p6', permissionName: 'DOCUMENT_READ', description: 'Read Document Exhibits', effect: 'ALLOW', scope: 'Org-Wide / Container' },
  { id: 'p7', permissionName: 'DOCUMENT_UPDATE', description: 'Update Document Versions', effect: 'ALLOW', scope: 'Org-Wide / Container' },
  { id: 'p8', permissionName: 'DOCUMENT_DOWNLOAD', description: 'Download Raw Documents', effect: 'ALLOW', scope: 'Org-Wide / Container' },
  { id: 'p9', permissionName: 'DOCUMENT_VERIFY', description: 'Verify Cryptographic Hashes', effect: 'ALLOW', scope: 'Org-Wide / Container' },

  // Evidence Operations
  { id: 'p10', permissionName: 'EVIDENCE_CREATE', description: 'Register Physical Evidence', effect: 'ALLOW', scope: 'Org-Wide / Container' },
  { id: 'p11', permissionName: 'EVIDENCE_READ', description: 'Inspect Physical Evidence', effect: 'ALLOW', scope: 'Org-Wide / Container' },
  { id: 'p12', permissionName: 'EVIDENCE_UPDATE', description: 'Update Physical Evidence', effect: 'ALLOW', scope: 'Org-Wide / Container' },
  { id: 'p13', permissionName: 'CUSTODY_TRANSFER', description: 'Initiate Custody Transfer', effect: 'ALLOW', scope: 'Org-Wide / Container' },
  { id: 'p14', permissionName: 'CUSTODY_ACCEPT', description: 'Accept Custody Handshake', effect: 'ALLOW', scope: 'Org-Wide / Container' },
  { id: 'p15', permissionName: 'CUSTODY_REJECT', description: 'Reject Custody Transfer', effect: 'ALLOW', scope: 'Org-Wide / Container' },
  { id: 'p16', permissionName: 'CUSTODY_HISTORY_READ', description: 'Read Custody Ledger', effect: 'ALLOW', scope: 'Org-Wide / Container' },

  // Governance Operations
  { id: 'p17', permissionName: 'AUDIT_READ', description: 'Inspect Audit Logs', effect: 'ALLOW', scope: 'Organization Setting' },
  { id: 'p18', permissionName: 'USER_CREATE', description: 'Provision / Enroll Users', effect: 'ALLOW', scope: 'Organization Setting' },
  { id: 'p19', permissionName: 'USER_READ', description: 'View Personnel Roster', effect: 'ALLOW', scope: 'Organization Setting' },
  { id: 'p20', permissionName: 'ROLE_CREATE', description: 'Manage Dynamic Roles', effect: 'ALLOW', scope: 'Organization Setting' },
  { id: 'p21', permissionName: 'ROLE_READ', description: 'View Dynamic Roles', effect: 'ALLOW', scope: 'Organization Setting' },
];
