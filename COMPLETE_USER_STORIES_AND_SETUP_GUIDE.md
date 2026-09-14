# Secure Digital Document & Evidence Management System (SDEMS)
## Complete Project Setup Guide & Feature-by-Feature User Story Testing Matrix
**Smart India Hackathon (SIH) — Problem Statement 1 (PS-1)**  
**Target Architecture:** Full-Stack Node.js (Express + Prisma + Ethers.js) & React (Vite + Redux Toolkit + Tailwind CSS)  
**Smart Contract:** `EvidenceRegistry.sol` on EVM Localhost (Hardhat Network 31337)  
**Database:** PostgreSQL (Neon Cloud / Local)  
**Search Engine:** Elasticsearch (BM25 + Semantic Vector Embeddings + OCR)  
**Storage:** Amazon S3 (`sih-ps-190-document-bucket` in `ap-south-1`)  
**Statutory Standards:** Section 65B Indian Evidence Act (IEA) & Section 63 Bharatiya Sakshya Adhiniyam (BSA)

---

## 📑 Table of Contents
1. [Architecture & Port Map](#1-architecture--port-map)
2. [Complete System Setup & Startup Runbook](#2-complete-system-setup--startup-runbook)
   - [2.1 Database Reset & Clean Slate Seed](#21-database-reset--clean-slate-seed)
   - [2.2 Seeded Credentials](#22-seeded-credentials)
   - [2.3 Blockchain Node & Smart Contract Deployment](#23-blockchain-node--smart-contract-deployment)
   - [2.4 Full Application Startup Sequence](#24-full-application-startup-sequence)
3. [End-to-End User Story Testing Playbook](#3-end-to-end-user-story-testing-playbook)
   - [Phase 1: Agency Bootstrapping & Officer Enrollment (Super Admin)](#phase-1-agency-bootstrapping--officer-enrollment-super-admin)
   - [Phase 2: Case Vault Creation & Multi-Tenant Access Control (CrPC / BNSS)](#phase-2-case-vault-creation--multi-tenant-access-control-crpc--bnss)
   - [Phase 3: Forensic Document Ingestion, Versioning & Smart Contract Anchoring](#phase-3-forensic-document-ingestion-versioning--smart-contract-anchoring)
   - [Phase 4: Physical Evidence Ingestion & Two-Party Custody Handshake](#phase-4-physical-evidence-ingestion--two-party-custody-handshake)
   - [Phase 5: Intelligent Search & In-File Extraction (Elasticsearch)](#phase-5-intelligent-search--in-file-extraction-elasticsearch)
   - [Phase 6: Independent Public Forensic Verification (Zero-Knowledge)](#phase-6-independent-public-forensic-verification-zero-knowledge)
   - [Phase 7: Immutable Audit Trail & Cryptographic Chain Verification](#phase-7-immutable-audit-trail--cryptographic-chain-verification)
   - [Phase 8: Statutory Reports & Certified Paper Ledger Printing](#phase-8-statutory-reports--certified-paper-ledger-printing)
4. [SIH Evaluator / Jury 5-Minute Demonstration Script](#4-sih-evaluator--jury-5-minute-demonstration-script)

---

## 1. Architecture & Port Map

| Component | Technology | Default Port / URL | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | React 18, Vite, Redux Toolkit, Tailwind | `http://localhost:5173` | Officer portal, evidence vault, ledger reports |
| **Backend REST API** | Node.js, Express, TypeScript, Prisma ORM | `http://localhost:5000/api` | Business logic, auth, audit chaining, streaming |
| **API Swagger Docs** | OpenAPI 3.0 / Swagger UI | `http://localhost:5000/api/docs` | Interactive API documentation & manual tests |
| **Local EVM Node** | Hardhat Local Blockchain Network | `http://127.0.0.1:8545` (Chain ID: 31337) | Smart contract anchoring for SHA-256 digests |
| **Smart Contract** | `EvidenceRegistry.sol` | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | On-chain hash anchoring & verification registry |
| **Database** | PostgreSQL (Neon Cloud / Local) | Port 5432 / Neon SSL Pooler | Relational store for users, cases, audit chains |
| **Search Engine** | Elasticsearch 8.x | `http://localhost:9200` | Full-text OCR, vector embeddings, multi-org search |
| **Cloud Object Store**| Amazon S3 (`sih-ps-190-document-bucket`) | `ap-south-1` | Encrypted binary storage for digital exhibits |

---

## 2. Complete System Setup & Startup Runbook

### 2.1 Database Reset & Clean Slate Seed

To start testing from a **100% clean state** (truncating all tables and seeding only the Global Super Admin):

1. Open a terminal in `backend/`:
   ```bash
   cd backend
   ```

2. Run the database seed script:
   ```bash
   node prisma/seed.js
   ```
   > 🧹 **Output Confirmation:**
   > ```text
   > ==========================================
   >    SEEDING GLOBAL SUPER ADMIN & PERMISSIONS 
   > ==========================================
   > 🧹 Clearing all existing database tables...
   > ✅ Database tables successfully cleared!
   > 🔑 Seeding system permission matrix...
   > 👤 Seeding Unassociated Standalone Super Admin Account...
   > ✅ GLOBAL STANDALONE SUPER ADMIN SEEDED SUCCESSFULLY!
   > ```

---

### 2.2 Seeded Credentials

After running the seed script, the database contains **only** the Global Super Admin account:

| Account Persona | Organization Code | Email Address | Password | Role / Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Global Super Admin** | `GOV-SUPERADMIN` | `superadmin@gov.in` | `Password123!` | **Standalone Global Admin** (Oversees all agencies nationwide; click `🛡️ Super Admin` button on login page) |

---

### 2.3 Blockchain Node & Smart Contract Deployment

The system anchors digital exhibit digests to an EVM smart contract (`EvidenceRegistry.sol`). Follow these commands to start the local blockchain node and deploy the contract:

#### Step 1: Start Local EVM Blockchain Node (Terminal 1)
```bash
# From backend directory
cd backend
npm run blockchain:node
```
> 💡 Keep Terminal 1 running. It listens on `http://127.0.0.1:8545` (Chain ID: `31337`).

#### Step 2: Deploy `EvidenceRegistry.sol` Smart Contract (Terminal 2)
```bash
# From backend directory
cd backend
npm run blockchain:deploy
```
> 🚀 **Expected Deployment Output:**
> ```text
> Deploying EvidenceRegistry smart contract...
> EvidenceRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
> ```
> ⚠️ Ensure `BLOCKCHAIN_CONTRACT_ADDRESS` in `backend/.env` matches `0x5FbDB2315678afecb367f032d93F642f64180aa3`.

---

### 2.4 Full Application Startup Sequence

Run the 3 processes in 3 separate terminal windows:

| Terminal | Module | Command | Listening URL |
| :--- | :--- | :--- | :--- |
| **Terminal 1** | **Local EVM Blockchain** | `cd backend && npm run blockchain:node` | `http://127.0.0.1:8545` |
| **Terminal 2** | **Backend API Server** | `cd backend && npm run dev` | `http://localhost:5000/api` |
| **Terminal 3** | **Frontend Web Application** | `cd frontend && npm run dev` | `http://localhost:5173` |

---

## 3. End-to-End User Story Testing Playbook

Follow this step-by-step narrative to test **100% of the platform's features** in a realistic law enforcement workflow.

---

### Phase 1: Agency Bootstrapping & Officer Enrollment (Super Admin)

#### Story 1.1: Log in as Global Super Admin
1. Open your web browser and navigate to `http://localhost:5173/login`.
2. Fill in the Login Form (or click `⚡ Quick Demo Login Fillers` -> `🛡️ Super Admin`):
   * **Organization Code:** `GOV-SUPERADMIN`
   * **Official Email Address:** `superadmin@gov.in`
   * **Account Password:** `Password123!`
3. Click **Sign In to Portal**.
4. **Verification:** You are redirected to the Dashboard (`/dashboard`). The sidebar displays full administrative navigation: *Organizations*, *Users*, *Cases*, *Documents*, *Evidence*, *Audit*, *Reports*, *Settings*.

#### Story 1.2: Register Agencies & Bootstrap Agency Administrators
1. Click **Organizations** in the sidebar (`/organizations`).
2. Click **+ Register Organization** (top right button).
3. Bootstrap Agency 1 (CBI):
   * **Organization Name:** `Central Bureau of Investigation`
   * **Organization Code:** `CBI-HQ`
   * **Admin Assignment Type:** Select `Create New Admin User`
   * **Admin Full Name:** `Inspector Vikram Rathore`
   * **Admin Official Email:** `investigator@cbi.gov.in`
   * **Admin Password:** `Investigator@123`
   * Click **Register Organization & Assign Admin**.
4. Click **+ Register Organization** again to bootstrap Agency 2 (CFSL):
   * **Organization Name:** `Central Forensic Science Laboratory`
   * **Organization Code:** `CFSL-DELHI`
   * **Admin Assignment Type:** Select `Create New Admin User`
   * **Admin Full Name:** `Dr. Ananya Sharma`
   * **Admin Official Email:** `lab@cfsl.gov.in`
   * **Admin Password:** `LabUser@123`
   * Click **Register Organization & Assign Admin**.
5. **Verification:** Both `Central Bureau of Investigation` (`CBI-HQ`) and `Central Forensic Science Laboratory` (`CFSL-DELHI`) appear in the organization card roster with their assigned Agency Admin officers.

---

### Phase 2: Case Vault Creation & Multi-Tenant Access Control (CrPC / BNSS)

#### Story 2.1: Log in as CBI Lead Investigator
1. Click **Logout** in the top header bar.
2. Log in using the newly created CBI Admin credentials:
   * **Organization Code:** `CBI-HQ`
   * **Official Email Address:** `investigator@cbi.gov.in`
   * **Account Password:** `Investigator@123`
3. Click **Sign In to Portal**. You are logged in as **Inspector Vikram Rathore** under `CBI-HQ`.

#### Story 2.2: Create Digital Case Vault
1. Click **Cases** in the sidebar (`/cases`).
2. Click **+ Create New Case**.
3. Enter Case Vault Details:
   * **Case Number:** `RC-DAI-2026-A-0012`
   * **Title:** `Offshore Cyber Extortion & Ransomware Operation`
   * **Description:** `Seized server logs, encrypted disk images, and physical NVMe drive from crime scene.`
4. Click **Create Case Vault**.
5. **Verification:** Case vault `RC-DAI-2026-A-0012` is created. You are automatically set as the **Case Creator / Admin**.

#### Story 2.3: Inter-Agency BOLA Protection Test
1. Log out and log in as `lab@cfsl.gov.in` / `LabUser@123` (Dr. Ananya Sharma, CFSL Examiner):
   * **Organization Code:** `CFSL-DELHI`
   * **Official Email Address:** `lab@cfsl.gov.in`
   * **Account Password:** `LabUser@123`
2. Click **Cases** (`/cases`).
3. **Verification:** Case `RC-DAI-2026-A-0012` is **completely hidden** from Dr. Ananya Sharma because she belongs to CFSL and has not been added as a participant on this CBI case vault.

#### Story 2.4: Grant Inter-Agency Case Access Permission
1. Log back in as `investigator@cbi.gov.in` / `Investigator@123` (Org Code: `CBI-HQ`).
2. Open case `RC-DAI-2026-A-0012`.
3. Navigate to **Team / Participants** tab.
4. Click **+ Add Participant**.
5. Select `Dr. Ananya Sharma (lab@cfsl.gov.in)` and assign permissions: `DOCUMENT_READ`, `EVIDENCE_READ`, `CUSTODY_ACCEPT`.
6. Click **Add Participant**.
7. **Verification:** `lab@cfsl.gov.in` is now an active participant on the case file.

---

### Phase 3: Forensic Document Ingestion, Versioning & Smart Contract Anchoring

#### Story 3.1: Upload Digital Exhibit & Smart Contract Anchoring
1. While logged in as `investigator@cbi.gov.in`, open case `RC-DAI-2026-A-0012`.
2. Click the **Documents** tab.
3. Click **+ Upload Document**.
4. Fill in Exhibit Metadata:
   * **Title:** `Suspect Command & Control Server Log`
   * **Document Type:** `Server Access Log`
   * **Description:** `Extracted SSH access logs showing unauthorized root login from remote IP.`
   * **Select File:** Choose a text/PDF file (e.g., `server_log.txt`).
5. Click **Upload Document**.
6. **Verification:**
   * File is uploaded directly to Amazon S3 (`sih-ps-190-document-bucket`).
   * Cryptographic SHA-256 digest is generated via stream.
   * Document is anchored to the Hardhat Ethereum Smart Contract (`EvidenceRegistry.sol`).
   * Display badge shows **v1 (Active)** and SHA-256 hash.

#### Story 3.2: Upload New Document Version (v2)
1. In the document list for `Suspect Command & Control Server Log`, click **Upload New Version**.
2. Select an updated or annotated version of the file.
3. Click **Upload Version**.
4. **Verification:**
   * Current version updates to **v2**.
   * Version history panel shows both **v1** and **v2** with their individual SHA-256 hashes, timestamps, and uploaders.

---

### Phase 4: Physical Evidence Ingestion & Two-Party Custody Handshake

#### Story 4.1: Log Seized Physical Hardware
1. Logged in as `investigator@cbi.gov.in`, navigate to **Physical Evidence** (`/evidence`).
2. Click **+ Log New Physical Evidence**.
3. Fill in Exhibit Specifications:
   * **Case:** Select `RC-DAI-2026-A-0012`
   * **Evidence Number:** `EVID-2026-0091`
   * **Title:** `Samsung NVMe SSD 1TB (Serial: S64GNS0T12894)`
   * **Description:** `Physical SSD seized from suspect workstation under tamper-evident seal #774B.`
4. Click **Create Evidence Record**.
5. **Verification:** Item `EVID-2026-0091` is created with status **ACTIVE**. Current custodian is **Inspector Vikram Rathore**.

#### Story 4.2: Initiate Two-Party Custody Transfer
1. Click **Initiate Transfer** on `EVID-2026-0091`.
2. Select Receiving Custodian: `Dr. Ananya Sharma (lab@cfsl.gov.in)`
3. Enter Transfer Basis: `Official delivery for bit-stream acquisition and malware reverse-engineering.`
4. Click **Submit Transfer Request**.
5. **Verification:** Evidence status updates to **IN_TRANSFER**. Transfer request status is **PENDING**.

#### Story 4.3: Receiving Officer Inspection & Acceptance Handshake
1. Log out and log in as `lab@cfsl.gov.in` / `LabUser@123` (Org Code: `CFSL-DELHI`).
2. Navigate to **Evidence & Custody** (`/custody` or `/evidence`).
3. Click **Pending Custody Transfers**.
4. Locate transfer `EVID-2026-0091`.
5. Click **Accept Custody & Sign Handshake**.
6. **Verification:**
   * Custody status changes to **ACCEPTED**.
   * Current custodian updates to **Dr. Ananya Sharma**.
   * A cryptographic `CustodyEvent` is generated with a unique `eventHash` chained to the previous custody state.

---

### Phase 5: Intelligent Search & In-File Extraction (Elasticsearch)

#### Story 5.1: Execute Scoped Multi-Org Search
1. Open the **Search Bar** in the top navigation header (`/search`).
2. Type a query keyword contained inside your uploaded document (e.g., `"unauthorized root login"` or `"NVMe SSD"`).
3. Press **Enter**.
4. **Verification:**
   * Elasticsearch performs a hybrid search (BM25 text matching + semantic vector embeddings).
   * Search results show matching exhibits with highlighted snippets and document version metadata.
   * Results are strictly filtered to cases where the user has permission.

---

### Phase 6: Independent Public Forensic Verification (Zero-Knowledge)

#### Story 6.1: Public Verification of Authentic Evidence (Verified Match)
1. Open an Incognito window and navigate to `http://localhost:5173/verification` (No login required).
2. Drag and drop the exact file that was uploaded in Phase 3 (`server_log.txt`).
3. Click **Compute Hash & Verify On-Chain**.
4. **Verification Result:**
   * Screen displays a green success badge: **"CRYPTOGRAPHIC HASH VERIFIED — AUTHENTIC RECORD"**.
   * Displays matching SHA-256 digest, original case number, upload timestamp, and Ethereum smart contract block verification.

#### Story 6.2: Bit-Flip Tamper Detection Test
1. Open `server_log.txt` on your desktop in a text editor.
2. Modify a single character or add a space, and save it as `tampered_log.txt`.
3. Drag and drop `tampered_log.txt` into `http://localhost:5173/verification`.
4. Click **Verify On-Chain**.
5. **Verification Result:**
   * Screen displays a prominent red warning: **"INTEGRITY CHECK FAILED — UNREGISTERED OR TAMPERED RECORD"**.
   * SHA-256 hash differs completely due to the avalanche effect.

---

### Phase 7: Immutable Audit Trail & Cryptographic Chain Verification

#### Story 7.1: Inspect Case Audit Trail
1. Log back in as `superadmin@gov.in` / `Password123!` (Org Code: `GOV-SUPERADMIN`).
2. Navigate to **Audit Trail** (`/audit`).
3. Select Case `RC-DAI-2026-A-0012`.
4. **Verification:** Chronological table displays every event with exact timestamps, sequence numbers, actor emails, IP addresses, and SHA-256 event hashes:
   - `#1 CASE_CREATED`
   - `#2 DOCUMENT_CREATED`
   - `#3 DOCUMENT_VERSION_CREATED`
   - `#4 CUSTODY_TRANSFER_INITIATED`
   - `#5 CUSTODY_TRANSFER_ACCEPTED`

#### Story 7.2: One-Click Audit Chain Verification
1. On the Audit Trail page, click **Verify Cryptographic Chain**.
2. **Verification:**
   * Backend iterates through all sequence records from Genesis (`seq #1`) to head, verifying:
     $$\text{EventHash}_i = \text{SHA256}(\text{CaseId} + \text{Seq}_i + \text{PrevHash}_{i-1} + \text{EventType} + \text{Metadata})$$
   * Screen displays: **"Audit Chain 100% Cryptographically Valid — Zero Tampering Detected"**.

---

### Phase 8: Statutory Reports & Certified Paper Ledger Printing

#### Story 8.1: Generate Evidence Integrity Report (Sec 65B IEA / Sec 63 BSA)
1. Click **Reports** in the sidebar (`/reports`).
2. Click **1. Evidence Integrity Report**.
3. Verify columns: *Case Number*, *Exhibit Title*, *SHA-256 Hash*, *Version*, *Blockchain Anchor*, *Upload Timestamp*.
4. Click **Export CSV Ledger**.
5. **Verification:** Downloads `evidence-integrity-report.csv`.

#### Story 8.2: Generate Forensic Chain of Custody Report
1. Click **2. Chain of Custody Report**.
2. Verify complete unbroken history of physical handshakes between Inspector Vikram Rathore and Dr. Ananya Sharma.
3. Click **Export CSV Ledger**.
4. **Verification:** Downloads `chain-of-custody-report.csv`.

#### Story 8.3: Print Official Certified Court Ledger
1. On the **Reports** page, click **Print Certified Ledger**.
2. **Verification:**
   * Print preview window opens with official header banner:
     `Government of India — National Forensic Evidence Portal`
     `Official Forensic Audit Trail & Chain-of-Custody Certification Ledger`
   * Navigation bars and buttons are automatically formatted for clean A4 paper printing (`print:hidden`).

---

## 4. SIH Evaluator / Jury 5-Minute Demonstration Script

Follow this script during your Smart India Hackathon final presentation:

* **Minute 1: Clean State & Agency Onboarding (Super Admin)**
  * Log in using `GOV-SUPERADMIN` / `superadmin@gov.in` / `Password123!`.
  * Register `CBI-HQ` and `CFSL-DELHI` agencies live on screen with their respective admins.

* **Minute 2: Case Vault & Multi-Tenant Access (BOLA Protection)**
  * Create Case `RC-DAI-2026-A-0012`.
  * Show inter-agency access restriction (CFSL cannot view case until granted permission).

* **Minute 3: Digital Exhibit Upload & Blockchain Anchoring**
  * Upload server log exhibit.
  * Show real-time SHA-256 hash generation, S3 storage, and Ethereum Smart Contract transaction confirmation.

* **Minute 4: Two-Party Physical Custody Handshake**
  * Initiate hardware transfer to CFSL Examiner.
  * Switch account to `lab@cfsl.gov.in` (Org Code: `CFSL-DELHI`) and click **Accept Custody**. Show hash-chained custody record.

* **Minute 5: Independent Public Verification & Statutory Reports**
  * Open `/verification` in Incognito:
    - Original file -> **CRYPTOGRAPHIC HASH VERIFIED**.
    - Tampered file -> **TAMPERING DETECTED**.
  * Open **Reports** -> Hit **Print Certified Ledger** for court submission.
