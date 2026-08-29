export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Secure Digital Document & Evidence Management API",
    version: "1.0.0",
    description: `
## Overview & Purpose
This API powers the **Secure Digital Document and Evidence Management System**.
It provides cryptographic chain-of-custody, tamper-evident audit trails, blockchain anchoring, role-based & attribute-based access control (RBAC/ABAC), and evidence tracking for law enforcement, forensic labs, legal teams, and judiciary systems.

### Authentication
Most endpoints require a **Bearer Token**.
1. Call \`POST /api/auth/login\` (or \`POST /api/organizations/bootstrap\` on first setup).
2. Copy the returned JWT token.
3. Click the **Authorize** button at the top right of Swagger UI and paste your token.
    `,
    contact: {
      name: "System Support",
      email: "support@evidence-management.org"
    }
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local Development Server"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT Bearer token obtained from POST /api/auth/login"
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    { name: "Auth", description: "Authentication and session management APIs" },
    { name: "Organizations", description: "Organization, role definition, and user management APIs" },
    { name: "Cases", description: "Investigative case creation, case directory, and participant assignment APIs" },
    { name: "Documents", description: "Digital document uploading, version control, and secure download APIs" },
    { name: "Evidence & Custody", description: "Physical evidence registration, transfer requests, and custody verification APIs" },
    { name: "Blockchain Integrity", description: "On-chain transaction proof, smart contract anchoring, and cryptographic verification APIs" },
    { name: "Audit Trail", description: "Append-only cryptographic audit logging and audit chain integrity verification APIs" },
    { name: "Authorization Engine", description: "Fine-grained ABAC/RBAC permission evaluation and override management APIs" }
  ],
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "User Login",
        description: "Authenticates user credentials (email & password), verifies active user status, and returns a signed JWT authentication token along with the user's profile and assigned roles.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "admin@forensics.gov" },
                  password: { type: "string", example: "AdminPass123!" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Authentication successful, returns JWT token and profile info."
          },
          401: { description: "Invalid credentials or inactive account." }
        }
      }
    },
    "/api/organizations/bootstrap": {
      post: {
        tags: ["Organizations"],
        summary: "Bootstrap Initial System",
        description: "System initialization endpoint to bootstrap default organization, root admin roles, permissions, and the initial system administrator account.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["organizationName", "organizationCode", "adminName", "adminEmail", "adminPassword"],
                properties: {
                  organizationName: { type: "string", example: "Central Forensic Science Laboratory" },
                  organizationCode: { type: "string", example: "CFSL-HQ" },
                  adminName: { type: "string", example: "Root System Admin" },
                  adminEmail: { type: "string", example: "root@forensics.gov" },
                  adminPassword: { type: "string", example: "RootSecurePass123!" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "System bootstrapped successfully." },
          400: { description: "System already bootstrapped or invalid input." }
        }
      }
    },
    "/api/organizations": {
      post: {
        tags: ["Organizations"],
        summary: "Create Organization",
        description: "Creates a new organization entity (e.g. Police Department, Forensic Lab, High Court) within the secure evidence management network.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "code", "type"],
                properties: {
                  name: { type: "string", example: "Metropolitan Police Department" },
                  code: { type: "string", example: "MPD-02" },
                  type: { type: "string", example: "POLICE" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Organization created successfully." }
        }
      }
    },
    "/api/organizations/{organizationId}/roles": {
      post: {
        tags: ["Organizations"],
        summary: "Create Organization Role",
        description: "Creates a new role with assigned granular permissions for a given organization.",
        parameters: [
          { name: "organizationId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the organization" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Lead Investigator" },
                  description: { type: "string", example: "Investigator with full document upload and case management access" },
                  permissions: {
                    type: "array",
                    items: { type: "string" },
                    example: ["CASE_VIEW", "DOCUMENT_UPLOAD", "EVIDENCE_MANAGE"]
                  }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Role created successfully." }
        }
      }
    },
    "/api/organizations/{organizationId}/users": {
      post: {
        tags: ["Organizations"],
        summary: "Create User in Organization",
        description: "Registers a new user account under an organization and assigns them a functional role.",
        parameters: [
          { name: "organizationId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the organization" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "fullName", "userType"],
                properties: {
                  email: { type: "string", example: "investigator1@mpd.gov" },
                  password: { type: "string", example: "Pass12345!" },
                  fullName: { type: "string", example: "Detective John Doe" },
                  userType: { type: "string", example: "INVESTIGATOR" },
                  roleId: { type: "string", example: "role-uuid-here" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "User created successfully." }
        }
      },
      get: {
        tags: ["Organizations"],
        summary: "List Organization Users",
        description: "Fetches active user directory and profiles for a specific organization.",
        parameters: [
          { name: "organizationId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the organization" }
        ],
        responses: {
          200: { description: "List of users in organization." }
        }
      }
    },
    "/api/organizations/{organizationId}/cases": {
      post: {
        tags: ["Cases"],
        summary: "Create Case",
        description: "Creates a new investigative case under an organization with unique case number, title, description, and status.",
        parameters: [
          { name: "organizationId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the organization" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["caseNumber", "title", "description"],
                properties: {
                  caseNumber: { type: "string", example: "CASE-2026-0891" },
                  title: { type: "string", example: "Operation Cyber Shield Evidence File" },
                  description: { type: "string", example: "Investigation into high-value financial fraud and digital evidence" },
                  status: { type: "string", example: "OPEN" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Case created successfully." }
        }
      },
      get: {
        tags: ["Cases"],
        summary: "List Organization Cases",
        description: "Retrieves all cases created under or accessible by an organization.",
        parameters: [
          { name: "organizationId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the organization" }
        ],
        responses: {
          200: { description: "List of accessible cases." }
        }
      }
    },
    "/api/cases/{caseId}": {
      get: {
        tags: ["Cases"],
        summary: "Get Case Details",
        description: "Retrieves complete details of a specific case, including metadata, assigned participants, documents, evidence items, and audit chain state.",
        parameters: [
          { name: "caseId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the case" }
        ],
        responses: {
          200: { description: "Detailed case object." },
          403: { description: "Access denied to case." },
          404: { description: "Case not found." }
        }
      }
    },
    "/api/cases/{caseId}/participants": {
      post: {
        tags: ["Cases"],
        summary: "Add Case Participant",
        description: "Assigns a user or external organization participant to a case with a designated case role (e.g., Lead Investigator, Evidence Officer, Prosecutor).",
        parameters: [
          { name: "caseId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the case" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "caseRole"],
                properties: {
                  userId: { type: "string", example: "user-uuid-123" },
                  caseRole: { type: "string", example: "LEAD_INVESTIGATOR" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Participant added to case successfully." }
        }
      },
      get: {
        tags: ["Cases"],
        summary: "List Case Participants",
        description: "Lists all authorized users and external organization participants assigned to a case.",
        parameters: [
          { name: "caseId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the case" }
        ],
        responses: {
          200: { description: "List of case participants." }
        }
      }
    },
    "/api/cases/{caseId}/documents": {
      post: {
        tags: ["Documents"],
        summary: "Upload Case Document",
        description: "Uploads a new digital document file to S3 secure storage and registers its initial version with cryptographic SHA-256 hash calculation.",
        parameters: [
          { name: "caseId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the case" }
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file", "title"],
                properties: {
                  file: { type: "string", format: "binary", description: "File attachment" },
                  title: { type: "string", example: "Forensic Hard Drive Disk Image Log" },
                  category: { type: "string", example: "TECHNICAL_REPORT" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Document uploaded and version 1 registered." }
        }
      },
      get: {
        tags: ["Documents"],
        summary: "List Case Documents",
        description: "Lists all registered documents and current version states associated with a specific case.",
        parameters: [
          { name: "caseId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the case" }
        ],
        responses: {
          200: { description: "List of documents." }
        }
      }
    },
    "/api/documents/{documentId}": {
      get: {
        tags: ["Documents"],
        summary: "Get Document Details",
        description: "Retrieves document metadata and its complete historical version timeline.",
        parameters: [
          { name: "documentId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the document" }
        ],
        responses: {
          200: { description: "Document detail with version history." }
        }
      }
    },
    "/api/documents/{documentId}/versions": {
      post: {
        tags: ["Documents"],
        summary: "Upload New Document Version",
        description: "Uploads a new version/revision of an existing document, recalculates its cryptographic SHA-256 hash, and logs an audit record.",
        parameters: [
          { name: "documentId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the document" }
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary", description: "Updated file binary" },
                  changeSummary: { type: "string", example: "Added supplementary forensic analysis charts" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "New version created successfully." }
        }
      }
    },
    "/api/documents/{documentId}/versions/{versionNumber}/download": {
      get: {
        tags: ["Documents"],
        summary: "Download Document Version",
        description: "Generates presigned download link or streams binary content for a specific document version.",
        parameters: [
          { name: "documentId", in: "path", required: true, schema: { type: "string" }, description: "UUID of the document" },
          { name: "versionNumber", in: "path", required: true, schema: { type: "integer" }, description: "Version number (e.g. 1, 2)" }
        ],
        responses: {
          200: { description: "Presigned URL or file download stream." }
        }
      }
    },
    "/api/evidence": {
      post: {
        tags: ["Evidence & Custody"],
        summary: "Register Physical Evidence",
        description: "Registers physical evidence items linked to a case, capturing barcode/serial numbers, physical storage locker location, and initial custodian.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["caseId", "title", "evidenceType"],
                properties: {
                  caseId: { type: "string", example: "case-uuid-here" },
                  title: { type: "string", example: "Encrypted External USB Drive" },
                  description: { type: "string", example: "Seized 2TB SanDisk Extreme SSD from primary suspect office" },
                  evidenceType: { type: "string", example: "DIGITAL_HARDWARE" },
                  serialNumber: { type: "string", example: "SN-99482019A" },
                  storageLocation: { type: "string", example: "Locker B-12, Evidence Vault 3" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Evidence registered successfully." }
        }
      }
    },
    "/api/evidence/{evidenceId}": {
      get: {
        tags: ["Evidence & Custody"],
        summary: "Get Evidence Details",
        description: "Retrieves physical evidence details, current custodian assignment, and vault location status.",
        parameters: [
          { name: "evidenceId", in: "path", required: true, schema: { type: "string" }, description: "UUID of evidence item" }
        ],
        responses: {
          200: { description: "Evidence details object." }
        }
      }
    },
    "/api/evidence/{evidenceId}/transfers": {
      post: {
        tags: ["Evidence & Custody"],
        summary: "Initiate Custody Transfer",
        description: "Initiates a formal chain-of-custody transfer request for physical evidence to another designated custodian.",
        parameters: [
          { name: "evidenceId", in: "path", required: true, schema: { type: "string" }, description: "UUID of evidence item" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["toUserId", "reason"],
                properties: {
                  toUserId: { type: "string", example: "user-uuid-custodian" },
                  reason: { type: "string", example: "Transferring physical SSD to Forensic Analyst for lab extraction" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Custody transfer initiated." }
        }
      }
    },
    "/api/transfers/{transferId}/accept": {
      post: {
        tags: ["Evidence & Custody"],
        summary: "Accept Custody Transfer",
        description: "Accepts an incoming evidence transfer request, updating current physical custodian and appending an immutable custody log.",
        parameters: [
          { name: "transferId", in: "path", required: true, schema: { type: "string" }, description: "UUID of transfer request" }
        ],
        responses: {
          200: { description: "Custody transfer accepted and logged." }
        }
      }
    },
    "/api/transfers/{transferId}/reject": {
      post: {
        tags: ["Evidence & Custody"],
        summary: "Reject Custody Transfer",
        description: "Rejects an incoming evidence transfer request with a required justification reason.",
        parameters: [
          { name: "transferId", in: "path", required: true, schema: { type: "string" }, description: "UUID of transfer request" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: {
                  reason: { type: "string", example: "Evidence seal arrived broken; rejected pending supervisor review" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Custody transfer rejected." }
        }
      }
    },
    "/api/evidence/{evidenceId}/custody-history": {
      get: {
        tags: ["Evidence & Custody"],
        summary: "Get Custody History Log",
        description: "Retrieves the complete, tamper-evident timeline of custody transfers and handler transactions for physical evidence.",
        parameters: [
          { name: "evidenceId", in: "path", required: true, schema: { type: "string" }, description: "UUID of evidence item" }
        ],
        responses: {
          200: { description: "Custody history trail." }
        }
      }
    },
    "/api/evidence/{evidenceId}/custody-history/verify": {
      get: {
        tags: ["Evidence & Custody"],
        summary: "Verify Custody Chain Integrity",
        description: "Cryptographically verifies the unbroken sequence of hash links in the physical evidence chain-of-custody log.",
        parameters: [
          { name: "evidenceId", in: "path", required: true, schema: { type: "string" }, description: "UUID of evidence item" }
        ],
        responses: {
          200: { description: "Verification result indicating whether chain is VALID or TAMPERED." }
        }
      }
    },
    "/api/blockchain/health": {
      get: {
        tags: ["Blockchain Integrity"],
        summary: "Check Blockchain Node Health",
        description: "Checks Ethereum/Polygon blockchain RPC node status, smart contract anchor deployment status, and wallet network connectivity.",
        responses: {
          200: { description: "Blockchain connection details and contract addresses." }
        }
      }
    },
    "/api/document-versions/{versionId}/blockchain": {
      get: {
        tags: ["Blockchain Integrity"],
        summary: "Get Document Blockchain Anchor Proof",
        description: "Retrieves block number, transaction hash, block timestamp, and cryptographic proof for a document version anchored on-chain.",
        parameters: [
          { name: "versionId", in: "path", required: true, schema: { type: "string" }, description: "UUID of document version" }
        ],
        responses: {
          200: { description: "Blockchain transaction and anchor proof receipt." }
        }
      }
    },
    "/api/document-versions/{versionId}/verify": {
      get: {
        tags: ["Blockchain Integrity"],
        summary: "Verify Document Against Blockchain Anchor",
        description: "Fetches document version hash from database and compares it against the smart contract anchor on the blockchain to guarantee content authenticity.",
        parameters: [
          { name: "versionId", in: "path", required: true, schema: { type: "string" }, description: "UUID of document version" }
        ],
        responses: {
          200: { description: "Verification status (MATCH / MISMATCH)." }
        }
      }
    },
    "/api/cases/{caseId}/audit": {
      get: {
        tags: ["Audit Trail"],
        summary: "Get Case Audit Trail Logs",
        description: "Retrieves chronological append-only audit trail logs tracking all actions, file access, and permissions executed on a case.",
        parameters: [
          { name: "caseId", in: "path", required: true, schema: { type: "string" }, description: "UUID of case" }
        ],
        responses: {
          200: { description: "List of audit trail log entries." }
        }
      }
    },
    "/api/cases/{caseId}/audit/verify": {
      get: {
        tags: ["Audit Trail"],
        summary: "Verify Cryptographic Audit Chain",
        description: "Cryptographically checks SHA-256 hash linkage of sequential audit log entries to ensure zero audit log tampering or deletion.",
        parameters: [
          { name: "caseId", in: "path", required: true, schema: { type: "string" }, description: "UUID of case" }
        ],
        responses: {
          200: { description: "Audit chain verification result (isValid, totalEvents)." }
        }
      }
    },
    "/api/authorization/cases/{caseId}/permissions": {
      post: {
        tags: ["Authorization Engine"],
        summary: "Grant Case Permission Override",
        description: "Grants an explicit granular permission rule (ALLOW or DENY override) to a specific user on a case.",
        parameters: [
          { name: "caseId", in: "path", required: true, schema: { type: "string" }, description: "UUID of case" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "action", "effect"],
                properties: {
                  userId: { type: "string", example: "user-uuid-here" },
                  action: { type: "string", example: "DOCUMENT_VIEW" },
                  effect: { type: "string", enum: ["ALLOW", "DENY"], example: "ALLOW" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Permission rule added/updated." }
        }
      },
      delete: {
        tags: ["Authorization Engine"],
        summary: "Revoke Case Permission Override",
        description: "Revokes explicit permission override rules for a user on a case.",
        parameters: [
          { name: "caseId", in: "path", required: true, schema: { type: "string" }, description: "UUID of case" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "action"],
                properties: {
                  userId: { type: "string", example: "user-uuid-here" },
                  action: { type: "string", example: "DOCUMENT_VIEW" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Permission override revoked." }
        }
      }
    },
    "/api/authorization/cases/{caseId}/permissions/check": {
      get: {
        tags: ["Authorization Engine"],
        summary: "Check User Permission for Action",
        description: "Evaluates ABAC/RBAC decision engine for a user action on a case to return explicit ALLOW or DENY authorization decision.",
        parameters: [
          { name: "caseId", in: "path", required: true, schema: { type: "string" }, description: "UUID of case" },
          { name: "action", in: "query", required: true, schema: { type: "string" }, description: "Permission action (e.g. DOCUMENT_VIEW, EVIDENCE_TRANSFER)" }
        ],
        responses: {
          200: { description: "Authorization result: { allowed: true/false, reason: string }" }
        }
      }
    },
    "/api/authorization/cases/{caseId}/users/{userId}/permissions": {
      get: {
        tags: ["Authorization Engine"],
        summary: "List User Permissions on Case",
        description: "Lists all effective permissions, assigned role capabilities, and explicit overrides applied to a specific user on a case.",
        parameters: [
          { name: "caseId", in: "path", required: true, schema: { type: "string" }, description: "UUID of case" },
          { name: "userId", in: "path", required: true, schema: { type: "string" }, description: "UUID of user" }
        ],
        responses: {
          200: { description: "Detailed list of user permissions." }
        }
      }
    }
  }
};
