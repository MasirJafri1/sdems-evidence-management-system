export const ROUTES = {
  PUBLIC: {
    LOGIN: '/login',
  },
  PROTECTED: {
    DASHBOARD: '/dashboard',
    CASES: {
      LIST: '/cases',
      DETAIL: '/cases/:caseId',
    },
    DOCUMENTS: {
      LIST: '/documents',
      DETAIL: '/documents/:documentId',
    },
    EVIDENCE: {
      LIST: '/evidence',
      DETAIL: '/evidence/:evidenceId',
    },
    CUSTODY: {
      LIST: '/custody',
      DETAIL: '/custody/:evidenceId',
    },
    VERIFICATION: '/verification',
    AUDIT: '/audit',
    USERS: '/users',
    ROLES: '/roles',
    PERMISSIONS: '/permissions',
    ORGANIZATIONS: '/organizations',
    REPORTS: '/reports',
    SETTINGS: '/settings',
  },
} as const;
