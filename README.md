# Secure Digital Document & Evidence Management System

> **SIH Problem Statement 1 (`sih_ps1`)**  
> An enterprise-grade, zero-trust digital evidence management platform combining multi-tenant organization collaboration, cryptographic file versioning, append-only audit chains, and on-chain Ethereum smart contract anchoring.

---

## 📐 System Architecture: The Off-Chain / On-Chain Triad

Storing large binary evidence files (e.g., multigiabyte forensic disk dumps) directly on a blockchain is cost-prohibitive. The system implements a **Hybrid Off-Chain Storage with On-Chain Anchoring Architecture**:

```text
+-------------------------------------------------------------------------------+
|                                  SYSTEM LAYER                                 |
+--------------------------+--------------------------+-------------------------+
|     POSTGRESQL (DB)      |        AWS S3            |  BLOCKCHAIN (HARDHAT)   |
|   Metadata & Search      |    Binary File Storage   |  Immutable Anchor Proof |
+--------------------------+--------------------------+-------------------------+
| • User & Org Accounts    | • Original file binaries | • Document Version      |
| • Case records           | • PDF reports            |   Content Hash          |
| • Case Participants      | • Media evidence         | • Custody Transfer      |
| • Relational indices     | • Presigned download     |   Event Hashes          |
| • ABAC permission rules  |   streams                | • Block Timestamps      |
+--------------------------+--------------------------+-------------------------+
```

---

## 🔒 Security Guarantees & Key Features

### 1. Solving the "DBA Dilemma" via Blockchain Anchoring
In traditional centralized databases, system administrators or compromised root accounts can alter timestamps, modify document hashes, or delete audit logs without leaving an internal trace.
- **On-Chain Proof**: Smart contract `EvidenceRegistry.sol` records deterministic Keccak-256 anchor IDs, SHA-256 document content hashes, block numbers, and block timestamps.
- **Non-Repudiation**: External judicial authorities and defense counsel can independently verify document authenticity directly against the blockchain without trusting central database logs.

### 2. Zero-Trust Access Control (RBAC + ABAC)
- **Role-Based Access Control (RBAC)**: Restricts actions based on organization roles (`Organization Admin`, `Investigator`, `Analyst`).
- **Attribute-Based Access Control (ABAC)**: Evaluates dynamic case participation guards and explicit `ALLOW` / `DENY` case-level permission overrides per user.

### 3. Append-Only Cryptographic Audit Chains
Every case action generates an `AuditEvent` storing:
- `sequence`: Sequential index per case.
- `previousHash`: Cryptographic SHA-256 hash linking to the preceding event.
- `eventHash`: SHA-256 digest of current event metadata + `previousHash`.

Any unauthorized deletion or modification breaks the hash chain, immediately flagged by `GET /api/cases/:caseId/audit/verify`.

### 4. Physical Evidence Chain-of-Custody
Physical items (e.g. seized USB drives, weapons) are tracked with handshake custody transfer workflows. Handover events are anchored on-chain with verifiable hash links.

---

## 📁 Repository Structure

```text
sih_ps1/
├── README.md                      # Main Architecture & Overview Documentation
└── backend/                       # Express API & Blockchain Backend
    ├── blockchain/                # Hardhat Solidity Smart Contracts & Deployment Scripts
    │   ├── contracts/             # EvidenceRegistry.sol Smart Contract
    │   ├── scripts/               # Hardhat Deployment Scripts
    │   └── hardhat.config.ts      # Hardhat Network Configuration
    ├── prisma/                    # Prisma Database Schema & Seed Data
    │   ├── schema.prisma          # PostgreSQL 13-Model Data Schema
    │   └── seed.ts                # System Permissions & Initial Seed Script
    ├── src/                       # TypeScript Source Code
    │   ├── config/                # Swagger Specs & Environment Parsing
    │   ├── middleware/            # Auth, ABAC/RBAC, Upload & Error Middlewares
    │   ├── modules/               # Feature Modules (auth, orgs, cases, docs, evidence, blockchain, audit)
    │   ├── utils/                 # Hashing, JWT, Password Utilities
    │   ├── app.ts                 # Express App Definition & Route Mounts
    │   └── server.ts              # Server Entrypoint
    ├── API_TESTING_GUIDE.md       # Interactive 8 User Story Swagger Testing Guide
    ├── CODEBASE_ANALYSIS.md       # Detailed Technical Architecture Report
    └── SETUP_GUIDE.md             # Environment Setup & Local Deployment Guide
```

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in the `backend/` directory:

```env
# Database Connection (PostgreSQL / Supabase)
DATABASE_URL="postgresql://username:password@host:5432/postgres"

# JWT Authentication Secret Key
JWT_SECRET="super-secret-jwt-key-min-16-chars"

# Server Port & Environment
PORT=5000
NODE_ENV="development"

# AWS S3 Storage Settings
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
S3_BUCKET_NAME="secure-evidence-bucket"

# Blockchain Settings (Hardhat Local Node Defaults)
BLOCKCHAIN_RPC_URL="http://127.0.0.1:8545"
BLOCKCHAIN_CHAIN_ID=31337
BLOCKCHAIN_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
BLOCKCHAIN_CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
cd backend
npm install
cd blockchain && npm install && cd ..
```

### 2. Run Database Migrations & Seed Permissions
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 3. Start Local Hardhat Blockchain Node (Terminal 1)
```bash
npm run blockchain:node
```

### 4. Compile & Deploy Smart Contracts (Terminal 2)
```bash
npm run blockchain:compile
npm run blockchain:deploy
```

### 5. Launch Backend Server
```bash
npm run dev
```

### 6. Access Interactive Swagger Documentation
Open your browser and navigate to:  
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

---

## 🧪 Automated Testing & Verification

All 26 Swagger API endpoints have been verified end-to-end with **100% Pass Rate**:

```text
=================================================
                 TEST SUMMARY                    
=================================================
TOTAL ENDPOINTS TESTED : 26
PASSED                 : 26
FAILED                 : 0
PASS RATE              : 100.0%
=================================================
```

---

## 📜 License
This project is developed for **SIH Problem Statement 1**.
