# SDEMS — Secure Digital Document & Evidence Management System

> **"Trusted records. Verifiable evidence."**

SDEMS is an enterprise-grade, government-compliant **Secure Digital Evidence & Document Management System**. Designed for law enforcement agencies, forensic laboratories, and judicial bodies, SDEMS combines **AWS S3 Object Storage**, **PostgreSQL Relational Databases**, and **Ethereum Smart Contract Blockchain Anchoring** to guarantee non-repudiation, tamper-evidence, and strict chain of custody.

---

## 🏛️ System Identity & Visual Theme

- **Primary Identity**: White Government-Grade Visual Identity (`bg-white` & `slate-50`)
- **Typography**: Google Fonts — **Plus Jakarta Sans** (Headings) & **Inter** (Body text)
- **Primary Color Palette**: High-contrast Navy Slate (`bg-slate-900`), Emerald Security Accents (`emerald-600`), and Crisp Slate Borders.

---

## 🏗️ System Architecture & Workflow Flowcharts

### 1. Full-Stack Data & Storage Pipeline

```mermaid
flowchart TD
    A[Investigative Officer / Browser UI] -->|1. Authenticate Bearer JWT| B[Express.js API Server]
    B -->|2. Compute SHA-256 Hash| C[Crypto Digest Engine]
    B -->|3. Encrypted Upload AES-256| D[(AWS S3 Storage Vault)]
    B -->|4. Persist Record Metadata| E[(PostgreSQL DB)]
    C -->|5. On-Chain Keccak-256 Anchor| F[Ethereum Blockchain Node]
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
   - Streamed binary upload via `multer` to AWS S3.
   - Server-Side Encryption using `AES256`.
   - Temporary, expiring S3 Presigned URLs (`getSignedUrl`) for secure downloads without exposing AWS credentials.

2. **⛓️ Blockchain Proof-of-Existence**:
   - Automated smart contract anchoring (`anchorDocumentVersion`) on Ethereum network.
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
| **Database** | PostgreSQL |
| **Object Storage** | AWS S3 (Amazon Web Services Simple Storage Service) |
| **Blockchain** | Ethereum Node, Hardhat, Ethers.js v6 |

---

## 🚀 Environment Setup & Installation Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

---

### 1. Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure Environment Variables (.env)
# Create a .env file inside backend/ with placeholders:
DATABASE_URL="postgresql://user:password@localhost:5432/sdems_db"
JWT_SECRET="your_jwt_secret_key_here"
PORT=5000
NODE_ENV="development"
AWS_REGION="your_aws_region_here"
AWS_ACCESS_KEY_ID="your_aws_access_key_id_here"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key_here"
S3_BUCKET_NAME="your_s3_bucket_name_here"
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

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
