# SDEMS — Secure Digital Document & Evidence Management System

> **"Trusted records. Verifiable evidence."**

SDEMS is an enterprise-grade, government-compliant **Secure Digital Evidence & Document Management System**. Designed for law enforcement agencies, forensic laboratories, and judicial bodies, SDEMS combines **AWS S3 Object Storage**, **PostgreSQL Relational Databases**, and **Ethereum Smart Contract Blockchain Anchoring** to guarantee non-repudiation, tamper-evidence, and strict chain of custody.

---

## 🏛️ System Identity & Visual Theme

- **Primary Identity**: White Government-Grade Visual Identity (`bg-white` & `slate-50`)
- **Typography**: Google Fonts — **Plus Jakarta Sans** (Headings) & **Inter** (Body text)
- **Primary Color Palette**: High-contrast Navy Slate (`bg-slate-900`), Emerald Security Accents (`emerald-600`), and Crisp Slate Borders.

---

## 📸 System Screenshots

### 1. Executive Integrity Dashboard
![Dashboard Overview](docs/images/dashboard_overview.png)

### 2. Active Case Registry
![Case Registry](docs/images/case_registry.png)

### 3. Digital Evidence Documents Binder
![Digital Evidence Binder](docs/images/documents_binder.png)

### 4. Encrypted AWS S3 Upload & Anchoring Pipeline
![Secure Upload Pipeline](docs/images/s3_pipeline_upload.png)

### 5. Cryptographic System Integrity Monitors
![System Integrity Monitors](docs/images/system_integrity_monitors.png)

---

## 🏗️ System Architecture & Workflow Flowcharts

### 1. Full-Stack Data & Storage Pipeline

```mermaid
flowchart TD
    A[Investigative Officer / Browser UI] -->|1. Authenticate Bearer JWT| B[Express.js API Server]
    B -->|2. Compute SHA-256 Hash| C[Crypto Digest Engine]
    B -->|3. Encrypted Upload AES-256| D[(AWS S3 Storage Vault)]
    B -->|4. Persist Record Metadata| E[(Supabase PostgreSQL DB)]
    C -->|5. On-Chain Keccak-256 Anchor| F[Hardhat Ethereum Node]
    F -->|6. Commit Block & Tx Hash| B
    B -->|7. Return Presigned URL & Anchor ID| A
```

---

### 2. Physical Evidence Chain of Custody Handshake

```mermaid
sequenceDiagram
    autonumber
    actor Relinquishing as Relinquishing Custodian
    participant API as Express Backend
    participant DB as PostgreSQL DB
    participant Chain as Blockchain Registry
    actor Receiving as Receiving Custodian

    Relinquishing->>API: Initiate Transfer (Evidence ID, Reason, Target Officer)
    API->>DB: Record CustodyTransfer (Status: PENDING)
    API-->>Receiving: Emit Pending Transfer Alert
    Receiving->>API: Sign & Accept Custody Handshake
    API->>Chain: Anchor Custody Event (Transfer Hash & Sequence)
    Chain-->>API: Confirm Tx Hash & Block Number
    API->>DB: Update Evidence Custodian & CustodyTransfer (Status: ACCEPTED)
    API-->>Relinquishing: Transfer Completed Notification
```

---

### 3. Cryptographic Verification Engine Flowchart

```mermaid
flowchart LR
    A[Document Binary / Upload] -->|Compute Hash| B(Local SHA-256 Digest)
    C[Ethereum Smart Contract] -->|Fetch Anchor| D(On-Chain Keccak-256 Hash)
    B --> E{Hash Comparison}
    D --> E
    E -->|Exact Match| F[STATUS: 100% Cryptographic Match Confirmed]
    E -->|Mismatch| G[STATUS: Tamper Warning - Hash Mismatch]
```

---

## ✨ Key Features

1. **🔒 Zero-Trust AWS S3 File Vault**:
   - Streamed binary upload via `multer` to AWS S3 (`ap-south-1`).
   - Server-Side Encryption using `AES256`.
   - Temporary, expiring S3 Presigned URLs (`getSignedUrl`) for secure downloads without exposing AWS credentials.

2. **⛓️ Blockchain Proof-of-Existence**:
   - Automated smart contract anchoring (`anchorDocumentVersion`) on Ethereum local node.
   - Dual-hash verification matching local SHA-256 fingerprints with on-chain Keccak-256 blocks.

3. **🤝 Physical Chain of Custody Portal**:
   - 2-party cryptographically signed handshakes for physical property (laptops, mobile phones, storage media).
   - Real-time status tracking (`PENDING`, `ACCEPTED`, `REJECTED`).

4. **⚡ Redux Toolkit State Management**:
   - Centralized global store powered by `@reduxjs/toolkit` with async thunks (`fetchCasesThunk`, `createCaseThunk`, `fetchDocumentsThunk`).
   - Dynamic UI reactivity with zero mock data fallbacks in production execution.

5. **🔍 Global Platform Search Engine**:
   - Instant search across active Case IDs, document titles, SHA-256 hashes, and officer rosters with strict null-safety.

---

## 🛠️ Technology Stack

| Layer | Technology Used |
| :--- | :--- |
| **Frontend UI** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **State & Routing** | Redux Toolkit (`@reduxjs/toolkit`), React Router v6, Axios |
| **Backend API** | Node.js, Express.js, Prisma ORM, Zod Validation |
| **Database** | PostgreSQL (Supabase Cloud Database) |
| **Object Storage** | AWS S3 (Amazon Web Services Simple Storage Service) |
| **Blockchain** | Hardhat Local Ethereum Node, Ethers.js v6 |

---

## 🚀 Environment Setup & Installation Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Hardhat Local Ethereum Node (Running at `http://127.0.0.1:8545`)

---

### 1. Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure Environment Variables (.env)
# Create a .env file inside backend/ with the following:
DATABASE_URL="postgresql://postgres:sihps113.com@db.wupztltfpaxubpyxlyec.supabase.co:5432/postgres"
JWT_SECRET="95f2e7f9b58a2c0f2471186bb199a6bfbc95f1462ebdc6e0fdd50cce225159e5"
PORT=5000
NODE_ENV="development"
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="AKIAUN3F5SSN7QG55D3A"
AWS_SECRET_ACCESS_KEY="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"
S3_BUCKET_NAME="secure-evidence-bucket"
BLOCKCHAIN_RPC_URL="http://127.0.0.1:8545"

# 3. Generate Prisma Client
npx prisma generate

# 4. Start Backend Server
npm run dev
```

The Express API will start on **`http://localhost:5000/api`**.

---

### 2. Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite Dev Server
npm run dev
```

The React Application will start on **`http://localhost:5173/`**.

---

## 🔐 Default Admin Credentials

- **Primary Admin Login**: `admin@cbi.gov`
- **Password**: `Password123!`
- **Organization**: `Central Bureau of Investigation` (`CBI-001`)

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
