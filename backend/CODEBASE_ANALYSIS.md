# Complete Codebase Analysis & System Architecture Guide

> **Secure Digital Document & Evidence Management System**  
> *SIH Problem Statement 1 (`sih_ps1`)*

---

## 📋 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [System Architecture & The Triad Model](#-system-architecture--the-triad-model)
3. [Core Security Mechanisms & Legal Guarantees](#-core-security-mechanisms--legal-guarantees)
   - [The DBA Dilemma & Blockchain Immutability](#the-dba-dilemma--blockchain-immutability)
   - [Cryptographic Proof of Existence & Timestamping](#cryptographic-proof-of-existence--timestamping)
   - [Append-Only Cryptographic Audit Chains](#append-only-cryptographic-audit-chains)
   - [Zero-Trust Access Control (RBAC + ABAC)](#zero-trust-access-control-rbac--abac)
4. [Documentation Breakdown](#-documentation-breakdown)
5. [Database Schema Reference (`schema.prisma`)](#-database-schema-reference-schemaprisma)
6. [Smart Contract Technical Specification (`EvidenceRegistry.sol`)](#-smart-contract-technical-specification-evidenceregistrysol)
7. [API Modules & Source Code Structure](#-api-modules--source-code-structure)
8. [End-to-End Data Lifecycles](#-end-to-end-data-lifecycles)
9. [Quick Setup & Verification Reference](#-quick-setup--verification-reference)

---

## 🚀 Executive Summary

The **Secure Digital Document & Evidence Management System** is a enterprise-grade, zero-trust digital forensic evidence management solution designed for law enforcement agencies, forensic laboratories, judicial authorities, and compliance auditors.

### Key Capabilities:
- **Multi-Tenant Agency Collaboration**: Secure cross-organizational case sharing and role management.
- **Cryptographic File Versioning**: Automated SHA-256 fingerprinting for every uploaded evidence file.
- **On-Chain Blockchain Anchoring**: Public, non-repudiable Proof of Existence anchored on an Ethereum (Hardhat) smart contract.
- **Physical Chain-of-Custody Tracking**: Cryptographically verified physical item custody handovers between custodians.
- **Tamper-Evident Audit Logging**: Append-only hash-linked audit trails that detect retroactive alteration or deletion.
- **Fine-Grained ABAC/RBAC Control**: Combined role permissions with dynamic case-level `GRANT` and `DENY` overrides.

---

## 🏗️ System Architecture & The Triad Model

Storing large binary evidence files directly on a blockchain is cost-prohibitive. The system implements a **Hybrid Off-Chain Storage with On-Chain Anchoring Architecture**:

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

## 🔒 Core Security Mechanisms & Legal Guarantees

### The DBA Dilemma & Blockchain Immutability
In centralized systems, database administrators or compromised root accounts can secretly modify records, forge timestamps, or delete logs without leaving an internal trace.

**Solution**:
1. **Decentralized Immutability**: Once evidence metadata is anchored to `EvidenceRegistry.sol`, no DBA or system administrator can alter past block state.
2. **Non-Repudiation**: Blockchain transactions permanently record the anchoring wallet address, block number, and block timestamp.
3. **Independent Judicial Verification**: External defense counsel or judges can independently verify document authenticity directly against the blockchain without trusting internal server logs.

---

### Cryptographic Proof of Existence & Timestamping
When a document revision is submitted:
1. The backend computes the file's **SHA-256 hash** (`contentHash`).
2. The backend sends a transaction to `EvidenceRegistry.sol` executing `anchorEvidence(...)`.
3. The smart contract calculates a deterministic `anchorId`:
   $$\text{anchorId} = \text{keccak256}(\text{abi.encode}(\text{caseIdHash}, \text{documentIdHash}, \text{version}))$$
4. The contract commits the `EvidenceAnchor` struct and emits an `EvidenceAnchored` event.

---

### Append-Only Cryptographic Audit Chains
Every action inside a case creates an `AuditEvent` record containing:
- `sequence`: Sequential index per case.
- `previousHash`: Cryptographic hash of the immediately preceding event.
- `eventHash`: SHA-256 hash of current event payload + `previousHash`.

$$\text{eventHash} = \text{SHA256}(\text{caseId} + \text{eventType} + \text{actorId} + \text{sequence} + \text{previousHash} + \text{timestamp})$$

Any attempt to delete or alter a past row breaks the hash chain, causing `verifyCaseAuditChain()` to return `isValid: false`.

---

### Zero-Trust Access Control (RBAC + ABAC)
Access decisions follow a strict evaluation pipeline:
1. **Active Account Guard**: Is user account active and organization membership active?
2. **Case Participation Guard**: Is user an assigned participant on the target case?
3. **Explicit ABAC Override Check**:
   - If an explicit `DENY` record exists in `CasePermission` $\rightarrow$ **DENY**.
   - If an explicit `GRANT` record exists in `CasePermission` $\rightarrow$ **ALLOW**.
4. **RBAC Fallback Check**: Does the user's organizational role contain the required permission?

---

## 📚 Documentation Breakdown

| File | Primary Focus | Key Content |
|---|---|---|
| [`SETUP_GUIDE.md`](SETUP_GUIDE.md) | Deployment & Setup | Prerequisites, `.env` config, Prisma migrations, Hardhat local node startup, contract deployment, server execution. |
| [`TECHNICAL_TERMINOLOGY.md`](TECHNICAL_TERMINOLOGY.md) | Architecture & Security | Cryptographic hashing (SHA-256, Keccak-256), smart contract mechanics, OpenZeppelin Access Control, DBA Dilemma solution. |
| [`API_TESTING_GUIDE.md`](API_TESTING_GUIDE.md) | Testing & User Journeys | 8 step-by-step User Story journeys testable interactively using Swagger UI (`/api-docs`). |

---

## 🗄️ Database Schema Reference (`schema.prisma`)

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Organization   │──────<│   Membership    │>──────│      User       │
└────────┬────────┘       └─────────────────┘       └────────┬────────┘
         │                                                   │
         │                                                   │
         ▼                                                   ▼
┌─────────────────┐                                 ┌─────────────────┐
│      Case       │<────────────────────────────────│ CaseParticipant │
└────────┬────────┘                                 └─────────────────┘
         │
         ├───────────────────────┬───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Document     │     │    Evidence     │     │   AuditEvent    │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ DocumentVersion │     │ CustodyTransfer │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│BlockchainAnchor │
└─────────────────┘
```

### Table Summary:
- **`Organization`**: Multi-tenant entity with unique organization code.
- **`User`**: Account identity with hashed password (`bcrypt`), email, and status.
- **`Role` & `Permission`**: Role definitions mapping permissions (`CASE_VIEW`, `DOCUMENT_UPLOAD`, etc.).
- **`Case` & `CaseParticipant`**: Case entity and member participation mappings.
- **`Document` & `DocumentVersion`**: Document records storing S3 keys, version numbers, and file hashes.
- **`BlockchainAnchor`**: On-chain status, transaction hash, block number, and `anchorId`.
- **`Evidence` & `CustodyTransfer` & `CustodyEvent`**: Physical items, transfer requests, and accepted custody logs.
- **`AuditEvent`**: Sequential tamper-evident event log.
- **`CasePermission`**: ABAC case-level `GRANT` and `DENY` explicit permissions.

---

## ⛓️ Smart Contract Technical Specification (`EvidenceRegistry.sol`)

### Contract Details:
- **Language**: Solidity `^0.8.28`
- **Security Standard**: OpenZeppelin `AccessControl`
- **Role Constant**: `ANCHOR_ROLE = keccak256("ANCHOR_ROLE")`

### Key Structs & Functions:

```solidity
struct EvidenceAnchor {
    bytes32 caseIdHash;
    bytes32 documentIdHash;
    bytes32 contentHash;
    uint64 version;
    uint64 anchoredAt;
    address anchoredBy;
}

function anchorEvidence(
    bytes32 caseIdHash,
    bytes32 documentIdHash,
    bytes32 contentHash,
    uint64 version
) external onlyRole(ANCHOR_ROLE) returns (bytes32 anchorId);

function verifyAnchor(
    bytes32 anchorId,
    bytes32 contentHash
) external view returns (bool);
```

```solidity
struct CustodyAnchor {
    bytes32 caseIdHash;
    bytes32 evidenceIdHash;
    bytes32 transferIdHash;
    bytes32 eventHash;
    uint64 sequence;
    uint64 anchoredAt;
    address anchoredBy;
}

function anchorCustodyEvent(
    bytes32 caseIdHash,
    bytes32 evidenceIdHash,
    bytes32 transferIdHash,
    bytes32 eventHash,
    uint64 sequence
) external onlyRole(ANCHOR_ROLE) returns (bytes32 anchorId);

function verifyCustodyAnchor(
    bytes32 anchorId,
    bytes32 eventHash
) external view returns (bool);
```

---

## 🛠️ API Modules & Source Code Structure

```text
backend/src/
├── app.ts                 # Express routing, middleware attachment, Swagger setup
├── server.ts              # Database connection initialization & HTTP server launch
├── config/
│   ├── env.ts             # Environment variable validation & defaults
│   └── swagger.ts         # OpenAPI 3.0 specification for Swagger UI
├── lib/
│   ├── prisma.ts          # Singleton Prisma Client instance
│   └── s3.ts              # AWS S3 Sdk client configuration
├── middleware/
│   ├── auth.ts            # Bearer JWT token authentication guard
│   ├── authorization.ts   # ABAC/RBAC authorization middleware
│   ├── error.ts           # Global error handler (handles Prisma P2002 duplicates)
│   ├── resource-authorization.ts # Case/document resource participant guard
│   └── upload.ts          # Multer in-memory file upload middleware
├── modules/
│   ├── audit/             # Audit logs & hash chain verification services
│   ├── auth/              # Authentication controller & routes
│   ├── authorization/     # ABAC permission management routes
│   ├── blockchain/        # Ethers.js integration for contract interaction
│   ├── cases/             # Case CRUD & participant onboarding
│   ├── documents/         # S3 uploads, SHA-256 hashing, versioning, presigned URLs
│   ├── evidence/          # Physical evidence registration & custody transfers
│   └── organizations/     # System bootstrap, organization & user management
└── utils/                 # Password hashing, JWT signing, cryptographic hash utilities
```

---

## 🔄 End-to-End Data Lifecycles

### Flow 1: Document Versioning & Blockchain Anchoring
```text
User Uploads File ──► Express (Multer) ──► Compute SHA-256 Hash ──► Upload Binary to S3
                                                                         │
                                                                         ▼
Client Query ◄── Verification (Match) ◄── Fetch Hardhat Contract ◄── Anchor Hash On-Chain
```

### Flow 2: Physical Custody Transfer & Verification
```text
Custodian A Initiates ──► Transfer Record (PENDING) ──► Custodian B Accepts
                                                                 │
                                                                 ▼
Verify Unbroken Chain ◄── Record Custody Event ◄── Generate Event Hash Link
```

---

## ⚡ Quick Setup & Verification Reference

```bash
# 1. Install dependencies
cd backend
npm install
cd blockchain && npm install && cd ..

# 2. Run Database Migrations & Seed Data
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 3. Start Local Hardhat Blockchain Node (Terminal 2)
npm run blockchain:node

# 4. Compile & Deploy Smart Contracts (Terminal 1)
npm run blockchain:compile
npm run blockchain:deploy

# 5. Start Backend Server
npm run dev

# 6. Access Interactive Swagger Documentation
# Open Browser: http://localhost:5000/api-docs
```

---

*Documentation compiled and generated for the Secure Digital Document & Evidence Management System.*
