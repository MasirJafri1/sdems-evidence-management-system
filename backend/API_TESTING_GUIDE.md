# Interactive API Testing Guide via Swagger UI

This document provides a step-by-step end-to-end testing workflow structured as **User Stories**. You will test all features of the **Secure Digital Document & Evidence Management System** using the interactive **Swagger UI** page.

---

## 🌐 Swagger UI Access & Authorization Setup

1. Make sure your backend server is running (`npm run dev`).
2. Open your browser and navigate to:
   👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**
3. **Authorization Header**:
   - Most endpoints require authentication.
   - When you log in or bootstrap the system, copy the `token` string returned in the JSON response.
   - Click the green **Authorize 🔓** button at the top right of the Swagger UI interface.
   - Paste your token into the `BearerAuth` text field and click **Authorize**.

---

## 📖 User Story Journeys

### 👤 User Story 1: System Bootstrapping & Root Admin Setup
**As a** System Administrator  
**I want to** initialize the application with a default root organization and admin credentials  
**So that** I can configure system roles and grant initial permissions.

#### Steps in Swagger UI:
1. Scroll to the **Organizations** tag and expand `POST /api/organizations/bootstrap`.
2. Click **Try it out**.
3. Use the following sample JSON request body:
   ```json
   {
     "organizationName": "Central Forensic Science Laboratory",
     "organizationCode": "CFSL-HQ",
     "adminName": "Chief System Admin",
     "adminEmail": "admin@forensics.gov",
     "adminPassword": "AdminSecurePassword123!"
   }
   ```
4. Click **Execute**.
5. **Verify**: Response code `201 Created`. Copy the `token`, `organization.id`, and `user.id` values.
6. Click **Authorize 🔓** at top right, paste the token, and authorize Swagger.

---

### 🏛️ User Story 2: Organization & User Provisioning
**As an** Organization Administrator  
**I want to** create partner organizations, custom roles, and investigator user accounts  
**So that** different agencies can collaborate securely on evidence files.

#### Steps in Swagger UI:
1. **Create Partner Organization**:
   - Expand `POST /api/organizations`.
   - Request Body:
     ```json
     {
       "name": "Metropolitan Police Department",
       "code": "MPD-DIST1",
       "type": "POLICE"
     }
     ```
   - Click **Execute**. Save the returned `id` (e.g. `mpd_org_id`).

2. **Create Custom Organization Role**:
   - Expand `POST /api/organizations/{organizationId}/roles`.
   - Set path parameter `organizationId` to your organization ID.
   - Request Body:
     ```json
     {
       "name": "Lead Forensic Analyst",
       "description": "Full access to evidence items and document upload",
       "permissions": ["CASE_VIEW", "DOCUMENT_UPLOAD", "EVIDENCE_MANAGE", "CUSTODY_TRANSFER"]
     }
     ```
   - Click **Execute**. Save the returned role `id`.

3. **Register New Investigator User**:
   - Expand `POST /api/organizations/{organizationId}/users`.
   - Set path parameter `organizationId`.
   - Request Body:
     ```json
     {
       "email": "detective.smith@mpd.gov",
       "password": "DetectivePass123!",
       "fullName": "Detective Sarah Smith",
       "userType": "INVESTIGATOR",
       "roleId": "<ROLE_ID_FROM_PREVIOUS_STEP>"
     }
     ```
   - Click **Execute**. Save the returned investigator `id`.

4. **List Organization Users**:
   - Expand `GET /api/organizations/{organizationId}/users`.
   - Click **Execute** and verify Detective Sarah Smith appears in the active directory.

---

### 📂 User Story 3: Case Initialization & Participant Onboarding
**As a** Lead Investigator  
**I want to** create a new investigative case file and assign team participants  
**So that** team members have authorized access to case evidence.

#### Steps in Swagger UI:
1. **Create Investigative Case**:
   - Expand `POST /api/organizations/{organizationId}/cases`.
   - Set path parameter `organizationId`.
   - Request Body:
     ```json
     {
       "caseNumber": "CASE-2026-CYBER-09",
       "title": "Operation Cyber Vault Investigation",
       "description": "High-value financial cybersecurity incident and digital forensics extraction",
       "status": "OPEN"
     }
     ```
   - Click **Execute**. Save the returned `caseId` (e.g. `case_uuid`).

2. **Assign Participant to Case**:
   - Expand `POST /api/cases/{caseId}/participants`.
   - Set path parameter `caseId`.
   - Request Body:
     ```json
     {
       "userId": "<INVESTIGATOR_USER_ID>",
       "caseRole": "LEAD_INVESTIGATOR"
     }
     ```
   - Click **Execute**. Response code `201 Created`.

3. **View Case Details**:
   - Expand `GET /api/cases/{caseId}`.
   - Set `caseId` and click **Execute**.
   - **Verify**: Response includes case metadata, status `OPEN`, and assigned participants list.

---

### 📄 User Story 4: Digital Document Upload & Cryptographic Versioning
**As a** Forensic Specialist  
**I want to** upload digital forensic files and new revisions to a case  
**So that** file modifications recalculate SHA-256 hashes and preserve version history.

#### Steps in Swagger UI:
1. **Upload Case Document**:
   - Expand `POST /api/cases/{caseId}/documents`.
   - Set `caseId`.
   - Under `file`, choose a local file (e.g. `disk_image_log.txt`).
   - Set `title` = `Hard Drive Disk Extraction Log`.
   - Set `category` = `FORENSIC_REPORT`.
   - Click **Execute**. Save the returned `documentId` and `versionId`.

2. **List Case Documents**:
   - Expand `GET /api/cases/{caseId}/documents`.
   - Click **Execute** and verify your document is listed with version `1`.

3. **Upload Document Revision (Version 2)**:
   - Expand `POST /api/documents/{documentId}/versions`.
   - Set `documentId`.
   - Attach an updated file in `file`.
   - Set `changeSummary` = `Appended memory dump analysis section`.
   - Click **Execute**. Save the new version ID.

4. **Download Version**:
   - Expand `GET /api/documents/{documentId}/versions/{versionNumber}/download`.
   - Set `documentId` and `versionNumber` = `1` (or `2`).
   - Click **Execute** to retrieve the presigned download link or binary file stream.

---

### 📦 User Story 5: Physical Evidence Registration & Chain-of-Custody Transfer
**As an** Evidence Custodian  
**I want to** register physical evidence and execute custody transfers  
**So that** physical evidence handling maintains an unbroken, verifiable log.

#### Steps in Swagger UI:
1. **Register Physical Evidence**:
   - Expand `POST /api/evidence`.
   - Request Body:
     ```json
     {
       "caseId": "<CASE_ID>",
       "title": "Seized Encrypted USB Flash Drive",
       "description": "128GB Kingston USB drive retrieved from suspect residence desk",
       "evidenceType": "DIGITAL_MEDIA",
       "serialNumber": "USB-KNG-99201",
       "storageLocation": "Locker A-04, Vault 2"
     }
     ```
   - Click **Execute**. Save the returned `evidenceId`.

2. **Initiate Chain-of-Custody Transfer**:
   - Expand `POST /api/evidence/{evidenceId}/transfers`.
   - Set `evidenceId`.
   - Request Body:
     ```json
     {
       "toUserId": "<RECIPIENT_USER_ID>",
       "reason": "Transferring physical USB drive to Forensic Lab Analyst for data recovery"
     }
     ```
   - Click **Execute**. Save the returned `transferId`.

3. **Accept Custody Transfer**:
   - Expand `POST /api/transfers/{transferId}/accept`.
   - Set `transferId`.
   - Click **Execute**.
   - **Verify**: Response confirms custody transferred to recipient user.

4. **Verify Custody Chain Integrity**:
   - Expand `GET /api/evidence/{evidenceId}/custody-history/verify`.
   - Set `evidenceId` and click **Execute**.
   - **Verify**: Response indicates `isValid: true` with unbroken hash links.

---

### ⛓️ User Story 6: On-Chain Blockchain Integrity & Verification
**As an** Independent Auditor / Judicial Authority  
**I want to** verify document SHA-256 hashes against on-chain smart contract anchors  
**So that** I can guarantee evidence has not been tampered with or retroactively altered.

#### Steps in Swagger UI:
1. **Check Blockchain Health**:
   - Expand `GET /api/blockchain/health`.
   - Click **Execute**.
   - **Verify**: Response shows status `ok`, network chain ID `31337`, and smart contract address.

2. **Get Blockchain Anchor Proof**:
   - Expand `GET /api/document-versions/{versionId}/blockchain`.
   - Set `versionId` from User Story 4.
   - Click **Execute**.
   - **Verify**: Response includes transaction hash, block number, and on-chain timestamp.

3. **Cryptographically Verify Document**:
   - Expand `GET /api/document-versions/{versionId}/verify`.
   - Set `versionId`.
   - Click **Execute**.
   - **Verify**: Response returns `verified: true` matching local hash with smart contract proof.

---

### 📜 User Story 7: Append-Only Audit Trail & Hash Link Verification
**As a** Compliance Inspector  
**I want to** audit all historical actions on a case and verify audit chain cryptographic hashes  
**So that** audit log deletion or alteration is detected immediately.

#### Steps in Swagger UI:
1. **Fetch Case Audit Trail**:
   - Expand `GET /api/cases/{caseId}/audit`.
   - Set `caseId` and click **Execute**.
   - **Verify**: Chronological list of events (Case creation, Participant added, Document upload, Custody transfer).

2. **Verify Audit Chain Integrity**:
   - Expand `GET /api/cases/{caseId}/audit/verify`.
   - Set `caseId` and click **Execute**.
   - **Verify**: `{"isValid": true, "totalEvents": X}` confirming no audit entries have been deleted or modified.

---

### 🔒 User Story 8: ABAC/RBAC Authorization Engine Permission Testing
**As a** Security Officer  
**I want to** test explicit permission rules (ALLOW / DENY overrides) on case actions  
**So that** inactive users or unassigned roles are blocked from case access.

#### Steps in Swagger UI:
1. **Check User Permission**:
   - Expand `GET /api/authorization/cases/{caseId}/permissions/check`.
   - Set `caseId` and query param `action` = `DOCUMENT_VIEW`.
   - Click **Execute**. Response evaluates user role & membership.

2. **Grant Explicit Permission Override**:
   - Expand `POST /api/authorization/cases/{caseId}/permissions`.
   - Request Body:
     ```json
     {
       "userId": "<TARGET_USER_ID>",
       "action": "DOCUMENT_DELETE",
       "effect": "DENY"
     }
     ```
   - Click **Execute**.

3. **List User Permissions**:
   - Expand `GET /api/authorization/cases/{caseId}/users/{userId}/permissions`.
   - Set `caseId` and `userId`.
   - Click **Execute**. Verify explicit `DENY` rule appears in the user's active permissions listing.

---

## 🎉 Summary Checklist

| User Story | Feature Tested | Expected Result |
|---|---|---|
| **Story 1** | System Bootstrap & Root Admin Login | JWT Token issued & Root Admin active |
| **Story 2** | Organizations, Roles & User Creation | Users & Roles registered in directory |
| **Story 3** | Case Initialization & Participants | Case created & Investigators assigned |
| **Story 4** | Document Upload & Versioning | S3 file upload & SHA-256 versioning |
| **Story 5** | Physical Evidence & Custody Transfer | Immutable custody transfer & integrity verification |
| **Story 6** | Blockchain Anchoring & Hash Proof | Database hash verified against Hardhat smart contract |
| **Story 7** | Audit Trail Verification | Zero audit tampering detected (`isValid: true`) |
| **Story 8** | ABAC/RBAC Permission Engine | ABAC decision engine returns explicit ALLOW/DENY |
