# Technical Terminologies & Blockchain Architecture Guide

This document provides a comprehensive breakdown of technical terminologies, security mechanisms, and the **Blockchain Architecture** powering the **Secure Digital Document & Evidence Management System**.

---

## 📚 1. Core Technical Terminologies

### Cryptographic SHA-256 & Keccak-256 Hashing
- **SHA-256 (Secure Hash Algorithm 256-bit)**: A mathematical one-way cryptographic hashing function that converts input data of any size (text, images, multi-gigabyte disk dumps) into a fixed-length 256-bit (64-character hexadecimal) string fingerprint.
- **Keccak-256**: The native cryptographic hash function used in Ethereum and Solidity smart contracts (the standard upon which SHA-3 was built). In this project, Keccak-256 is used on-chain to generate deterministic `bytes32` anchor identifiers (`anchorId`) and role identifier hashes (`ANCHOR_ROLE = keccak256("ANCHOR_ROLE")`).
- **Key Property (Avalanche Effect)**: Even if a single bit or letter in a multi-gigabyte evidence file is changed, the resulting hash changes completely.
- **Purpose**: Used to generate unique digital fingerprints for every document version, physical evidence record, and audit log entry.

### Smart Contracts
- **What it is**: An immutable, self-executing computer program deployed directly onto a blockchain network. Its rules, data structures, and function logic are executed deterministically by blockchain nodes.
- **Purpose**: Acts as an unbiased, non-repudiable registry (`EvidenceRegistry.sol`) that records evidence fingerprints and chain-of-custody transfer events. Once deployed, no administrator or third party can alter its deployed code or past transaction records.

### Solidity (`^0.8.28`)
- **What it is**: An object-oriented, high-level statically typed programming language designed specifically for developing smart contracts that run on the Ethereum Virtual Machine (EVM).
- **Purpose**: Used to write the project's core smart contract ([`EvidenceRegistry.sol`](blockchain/contracts/EvidenceRegistry.sol)), defining state variables, struct data models (`EvidenceAnchor`, `CustodyAnchor`), custom error types, and permissioned functions (`anchorEvidence`, `anchorCustodyEvent`).

### Hardhat Framework & Local Node
- **What it is**: An industry-standard Ethereum development environment and task runner for compiling, testing, debugging, and deploying Solidity smart contracts.
- **Hardhat Local Node (`hardhat node`)**: Launches a local simulated Ethereum blockchain network on `http://127.0.0.1:8545` with 20 pre-funded test accounts and instantaneous block mining.
- **Purpose**: Enables local offline development and automated testing without requiring real cryptocurrency or paying public gas fees during development.

### Blockchain Anchor & On-Chain Anchoring
- **What it is**: The cryptographic process of embedding a document's SHA-256 hash or custody event fingerprint into a transaction state inside a blockchain smart contract.
- **Purpose**: Creates an immutable **Proof of Existence** and **Proof of Timestamp**. Even if the database is reset or wiped, the anchor on the blockchain remains permanently intact as proof that the evidence existed in that exact form at that exact timestamp.

### OpenZeppelin's `AccessControl`
- **What it is**: A battle-tested, standard smart contract security module provided by OpenZeppelin that implements Role-Based Access Control (RBAC) in Solidity.
- **How it works in `EvidenceRegistry.sol`**:
  - Roles are defined as `bytes32` constant hashes: `bytes32 public constant ANCHOR_ROLE = keccak256("ANCHOR_ROLE")`.
  - Functions like `anchorEvidence(...)` use the modifier `onlyRole(ANCHOR_ROLE)` to ensure that **only authorized backend service wallets** can write new anchor records onto the blockchain, while public read functions (`getAnchor`, `verifyAnchor`) remain open to anyone.

### Chain of Custody (CoC)
- **What it is**: The chronological, unbroken record logging the possession, custody, transfer, analysis, and disposition of physical or digital evidence.
- **Purpose**: Ensures physical items (e.g. seized hard drives, weapons, blood samples) and digital items are handled exclusively by authorized personnel and cannot be secretly substituted or altered.

### RBAC vs. ABAC Authorization
- **RBAC (Role-Based Access Control)**: Restricts system actions based on assigned user roles (e.g., `LEAD_INVESTIGATOR`, `FORENSIC_ANALYST`, `EVIDENCE_CUSTODIAN`).
- **ABAC (Attribute-Based Access Control)**: Dynamically evaluates rules based on attributes of the user, case, and context (e.g., Is user an active participant of this specific case? Is the user account suspended? Is there an explicit case-level `ALLOW` or `DENY` override?).
- **Purpose**: Enforces zero-trust access control to sensitive case documents.

### Append-Only Audit Trail
- **What it is**: A database design pattern where records can strictly only be created (`INSERT`) and never updated (`UPDATE`) or deleted (`DELETE`). Each audit event contains a `previousHash` linking to the hash of the preceding event, forming an immutable hash chain.
- **Purpose**: Detects any unauthorized deletion or retroactive alteration of system audit logs.

### AWS S3 Presigned URLs
- **What it is**: Short-lived, cryptographically signed HTTP links generated by the backend that grant temporary access to private S3 files.
- **Purpose**: Allows authorized users to securely stream or download evidence files without exposing AWS storage credentials or making S3 buckets public.

---

## ⛓️ 2. Blockchain Architecture Deep-Dive

### Why Use Blockchain in Evidence Management?

In traditional software systems, all data resides in a central database (e.g. PostgreSQL). However, a central database poses a fundamental security risk in forensic and legal contexts:

> **The Database Administrator (DBA) Dilemma & Repudiation Risk**:  
> Anyone with database access (or an attacker who gains DB root credentials) can alter database timestamps, update document hashes, or delete audit records without leaving a trace inside the database itself. In court, a defense lawyer can challenge evidence by asserting: *"How do we know the police or database admin didn't modify this file after seizure?"*

**Blockchain solves this problem through Decentralized Immutability and Non-Repudiation**:
1. **Decentralized Immutability**: Once data is written to a blockchain smart contract, no server operator, system administrator, or hacker can delete or alter that block record.
2. **Non-Repudiation**: The block timestamp and deployer/anchor wallet address serve as cryptographic proof of who committed the evidence proof and exactly when.
3. **Independent Judicial Verification**: External judges, defense attorneys, and auditors can independently query the public blockchain smart contract to verify document authenticity without relying on server logs or trusting database state.

---

### System Architecture: The Off-Chain / On-Chain Triad

Storing full binary files (e.g. 5GB forensic disk images) on a blockchain is prohibitively expensive in gas fees and block storage limits. Therefore, the system utilizes a **Hybrid Off-Chain Storage with On-Chain Anchoring Architecture**:

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

### Smart Contract Breakdown: `EvidenceRegistry.sol`

The `EvidenceRegistry.sol` smart contract is written in Solidity (`^0.8.28`) and utilizes OpenZeppelin's `AccessControl` framework.

#### Key Smart Contract Functions & Structs

1. **`EvidenceAnchor` Struct**:
   ```solidity
   struct EvidenceAnchor {
       bytes32 caseIdHash;
       bytes32 documentIdHash;
       bytes32 contentHash;      // Cryptographic SHA-256 hash of the document file
       uint64 version;           // Version number (1, 2, etc.)
       uint64 anchoredAt;        // Block timestamp
       address anchoredBy;       // Wallet address of the anchor service
   }
   ```

2. **`anchorEvidence(...)`**:
   - Computes a unique deterministic `anchorId`:
     $$\text{anchorId} = \text{keccak256}(\text{abi.encode}(\text{caseIdHash}, \text{documentIdHash}, \text{version}))$$
   - Verifies `anchorId` does not already exist (prevents overwriting version history).
   - Records `EvidenceAnchor` struct on-chain and emits the `EvidenceAnchored` event.

3. **`anchorCustodyEvent(...)`**:
   - Computes a unique deterministic `custodyAnchorId`:
     $$\text{anchorId} = \text{keccak256}(\text{abi.encode}(\text{caseIdHash}, \text{evidenceIdHash}, \text{transferIdHash}, \text{sequence}))$$
   - Records physical evidence transfer event hash on-chain and emits the `CustodyEventAnchored` event.

4. **`verifyAnchor(anchorId, contentHash)`**:
   - Returns `true` if the submitted file `contentHash` exactly matches the `contentHash` stored permanently inside the smart contract state.

---

### Step-by-Step Verification Workflow

```text
                        ┌────────────────────────┐
                        │ Document Verification  │
                        └───────────┬────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │                                               │
   1. Fetch File from S3                           2. Fetch Anchor Proof
      Compute SHA-256 Hash                             from Smart Contract
   (e.g., 0xa8f3c2...91e)                         (e.g., 0xa8f3c2...91e)
            │                                               │
            └───────────────────────┬───────────────────────┘
                                    │
                                    ▼
                         Compare Hashes On-Chain
                                    │
                   ┌────────────────┴────────────────┐
                   ▼                                 ▼
         Hashes Match Exactly              Hashes Do Not Match
       [VERIFIED - AUTHENTIC]            [TAMPERED - INVALIDATED]
```

---

## 🎯 Summary Matrix

| Component | Technology | Responsibility & Security Guarantee |
|---|---|---|
| **Smart Contract** | Solidity (`^0.8.28`) | Self-executing code managing document and custody anchor state |
| **Development Node** | Hardhat | Local Ethereum RPC provider on `http://127.0.0.1:8545` for compilation & deployment |
| **Access Control** | OpenZeppelin `AccessControl` | Enforces `onlyRole(ANCHOR_ROLE)` on write transactions while keeping reads open |
| **Hashing Engine** | Keccak-256 & SHA-256 | Keccak-256 for EVM anchor IDs/roles; SHA-256 for file content hashes |
| **Relational Database** | PostgreSQL & Prisma | Fast metadata indexing, user directory, and case search |
| **File Storage** | AWS S3 | Encrypted binary storage accessed via short-lived presigned URLs |
| **Audit Chain** | Prisma `previousHash` Links | Internal append-only tamper-evident log verification |
