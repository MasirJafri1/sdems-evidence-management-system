<div align="center">

# 🏛️ SMART INDIA HACKATHON 2026
## `sdems-evidence-management-system`

### **Problem Statement ID:** `26190`
### **Problem Statement Title:** Secure Digital Document Management System for Legal and Investigation Documents
### **Theme:** Blockchain & Cybersecurity | **Category:** Software
### **Team Name:** `ThreeSixNine`

---

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-336791.svg)](https://www.postgresql.org/)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-8.13-005571.svg)](https://www.elastic.co/)
[![Hardhat](https://img.shields.io/badge/Blockchain-Hardhat%20EVM-yellow.svg)](https://hardhat.org/)
[![Hyperledger Fabric Ready](https://img.shields.io/badge/Enterprise-Hyperledger%20Fabric-navy.svg)](https://www.hyperledger.org/projects/fabric)
[![Swagger](https://img.shields.io/badge/API%20Docs-Swagger%20UI-85EA2D.svg)](http://localhost:5000/api-docs)
[![Pass Rate](https://img.shields.io/badge/API%20Tests-100%25%20Passed-brightgreen.svg)](#-automated-testing--api-verification)

<p align="center">
  <b>SDEMS - Secure Digital Document & Evidence Management System</b><br>
  <i>"The file can move; its verified history does not."</i><br>
  <i>"A conventional DMS manages documents. Our platform proves the trust, lifecycle, and cryptographic provenance of evidence."</i>
</p>

</div>

---


<div align="center">

---

## 👥 Team ThreeSixNine

- **Shreykumar Patel**
- **Harshit Agarwal**
- **Jeenal Patel**
- **Khushi Surti**
- **Kapil Jangid**
- **Masirabbas Jafri**

---

## 📑 Table of Contents

- [Executive Overview](#-executive-overview)
- [The Problem vs. How SDEMS Solves It](#-the-problem-vs-how-sdems-solves-it)
- [System Architecture &amp; The Data Triad](#-system-architecture--the-data-triad)
- [Evidence Cycles &amp; Data Flow Diagrams](#-evidence-cycles--data-flow-diagrams)
  - [1. Evidence Ingestion &amp; Anchoring Flow](#1-evidence-ingestion--anchoring-flow)
  - [2. Custody Handshake &amp; Hash Verification Flow](#2-custody-handshake--hash-verification-flow)
  - [3. Append-Only Cryptographic Audit Trail](#3-append-only-cryptographic-audit-trail)
- [Technical Stack &amp; Component Breakdown](#-technical-stack--component-breakdown)
- [Security, Cryptography &amp; Legal Admissibility](#-security-cryptography--legal-admissibility)
  - [Solving the &#34;DBA Dilemma&#34;](#solving-the-dba-dilemma)
  - [Cryptographic Formulations](#cryptographic-formulations)
  - [Zero-Trust Access Control (RBAC + ABAC)](#zero-trust-access-control-rbac--abac)
- [Current Implementation vs. Future Roadmap](#-current-implementation-vs-future-roadmap)
- [Feasibility, Viability &amp; Mitigation Strategies](#-feasibility-viability--mitigation-strategies)
- [Competitive Benchmarking Matrix](#-competitive-benchmarking-matrix)
- [Impact &amp; Stakeholder Benefits](#-impact--stakeholder-benefits)
- [Research Citations &amp; Scientific References](#-research-citations--scientific-references)
- [Repository Structure](#-repository-structure)
- [Local Setup &amp; Quick Start Guide](#-local-setup--quick-start-guide)
- [Automated Testing &amp; API Verification](#-automated-testing--api-verification)

---

## 💡 Executive Overview

During criminal, forensic, and corporate investigations, evidence lifecycle management determines the success or failure of justice. Today, investigating officers, forensic examiners, prosecutors, and judiciary personnel face severe friction: fragmented file storage across department silos, vulnerable relational databases subject to privileged tampering, scanned documents whose text cannot be searched, and broken chains of custody that compromise legal admissibility under the **Indian Evidence Act / Bharatiya Sakshya Adhiniyam (BSA)**.

**SDEMS (Secure Digital Document & Evidence Management System)** is an enterprise-grade, zero-trust digital evidence repository designed for high-stakes legal ecosystems. Built on the principle of **separation of data and trust responsibilities**, SDEMS separates unstructured storage from metadata, search indices, and immutable blockchain ledgers. Every file revision receives an immutable cryptographic SHA-256 fingerprint anchored to a blockchain smart contract, ensuring that neither rogue system administrators nor compromised database servers can forge or backdate evidence without immediate mathematical detection.

---

## 🎯 The Problem vs. How SDEMS Solves It

```mermaid
graph TD
    subgraph "Legacy Legal & Investigation Dilemmas"
        P1["📁 Fragmented Records<br>Siloed in emails, drives, physical cabinets"]
        P2["🔓 Unauthorized Access<br>Over-privileged logins and weak session controls"]
        P3["⚠️ Tampering Risk (DBA Dilemma)<br>Root admins can silently alter records & timestamps"]
        P4["🔄 Version Confusion<br>Multiple untracked copies in circulation"]
        P5["⏳ Slow Retrieval<br>Critical text buried in unsearchable scanned PDFs"]
        P6["⛓️ Broken Evidence Trail<br>No immutable chronological transfer history"]
    end

    subgraph "SDEMS Cryptographic & Architectural Solutions"
        S1["🏢 Centralized Case Vaults<br>Unified multi-tenant organization & case workspaces"]
        S2["🛡️ RBAC + ABAC Zero-Trust<br>Role authorization with dynamic case-level grants/denies"]
        S3["⛓️ Blockchain Anchoring<br>Public or Consortium Proof of Existence (EVM / Fabric)"]
        S4["🔐 SHA-256 Version Fingerprints<br>Deterministic hashing for every file revision"]
        S5["🔍 OCR + Elasticsearch Pipeline<br>Tesseract + PDF parser + Vector Semantic Search"]
        S6["🤝 Cryptographic Custody Handshake<br>Dual-confirmation physical/digital transfer logs"]
    end

    P1 -.-> S1
    P2 -.-> S2
    P3 -.-> S3
    P4 -.-> S4
    P5 -.-> S5
    P6 -.-> S6

    style P1 fill:#fee2e2,stroke:#ef4444,stroke-width:1px,color:#1f2937
    style P2 fill:#fee2e2,stroke:#ef4444,stroke-width:1px,color:#1f2937
    style P3 fill:#fee2e2,stroke:#ef4444,stroke-width:1px,color:#1f2937
    style P4 fill:#fee2e2,stroke:#ef4444,stroke-width:1px,color:#1f2937
    style P5 fill:#fee2e2,stroke:#ef4444,stroke-width:1px,color:#1f2937
    style P6 fill:#fee2e2,stroke:#ef4444,stroke-width:1px,color:#1f2937

    style S1 fill:#dcfce7,stroke:#22c55e,stroke-width:1px,color:#1f2937
    style S2 fill:#dcfce7,stroke:#22c55e,stroke-width:1px,color:#1f2937
    style S3 fill:#dcfce7,stroke:#22c55e,stroke-width:1px,color:#1f2937
    style S4 fill:#dcfce7,stroke:#22c55e,stroke-width:1px,color:#1f2937
    style S5 fill:#dcfce7,stroke:#22c55e,stroke-width:1px,color:#1f2937
    style S6 fill:#dcfce7,stroke:#22c55e,stroke-width:1px,color:#1f2937
```

---

## 📐 System Architecture & The Data Triad

SDEMS adopts an **Off-Chain Storage with On-Chain Proof** paradigm. Storing gigabytes or terabytes of high-resolution digital forensic images (e.g. EnCase images, CCTV footage, phone extractions) directly on a blockchain is technically infeasible and cost-prohibitive.

Instead, SDEMS cleanly decouples state into four specialized layers:

```mermaid
flowchart TB
    subgraph ClientLayer ["🖥️ Client Presentation Layer"]
        UI["React 19 + TypeScript + Vite + Tailwind CSS"]
        State["Redux Toolkit + React Router v7"]
        Icons["Lucide Icons + Accessible Modern UI Components"]
    end

    subgraph APILayer ["⚡ Backend Gateway & Core API (Node.js + Express 5)"]
        AuthMiddleware["JWT Authentication + Active Org Guard"]
        AccessControl["RBAC + ABAC Policy Engine (Case Permissions)"]
        AuditPipeline["Cryptographic Audit Chain Generator"]
        SearchPipeline["OCR & Extraction Engine (Tesseract + PDF-Parse + Mammoth)"]
        ChainBridge["Ethers.js Smart Contract Bridge"]
    end

    subgraph DataTriad ["🏛️ Storage, State & Trust Responsibilities (The Triad)"]
        subgraph StorageLayer ["☁️ Binary Evidence Storage"]
            S3["Amazon S3 / S3-Compatible Object Store"]
            S3Details["• Presigned Secure URLs<br>• Versioning & Object Lock<br>• Client Isolation"]
        end

        subgraph RelationalLayer ["🗄️ Relational Metadata & Workflow"]
            PG["PostgreSQL (Prisma ORM)"]
            PGDetails["• Organizations & Users<br>• Cases & Role Memberships<br>• Physical Custody Handshakes<br>• Append-Only Audit Hashes"]
        end

        subgraph SearchLayer ["🔎 Search & AI Intelligence"]
            ES["Elasticsearch 8 Cluster"]
            ESDetails["• OCR Full-Text Indices<br>• Dense Vector Embeddings<br>• Groq LLM Semantic Summaries"]
        end

        subgraph BlockchainLayer ["⛓️ Decentralized Proof of Existence"]
            Ledger["Blockchain Ledger (EVM Smart Contract / Fabric)"]
            BCDetails["• EvidenceRegistry.sol<br>• Deterministic Anchor ID<br>• SHA-256 Fingerprint Commit<br>• Non-Repudiable Timestamp"]
        end
    end

    UI --> AuthMiddleware
    State --> AuthMiddleware
    AuthMiddleware --> AccessControl
    AccessControl --> AuditPipeline
    AccessControl --> S3
    AuditPipeline --> PG
    AccessControl --> SearchPipeline
    SearchPipeline --> ES
    AccessControl --> ChainBridge
    ChainBridge --> Ledger

    style ClientLayer fill:#eff6ff,stroke:#3b82f6,stroke-width:2px
    style APILayer fill:#f8fafc,stroke:#64748b,stroke-width:2px
    style DataTriad fill:#fdf4ff,stroke:#c084fc,stroke-width:2px
    style StorageLayer fill:#f0fdf4,stroke:#22c55e,stroke-width:1px
    style RelationalLayer fill:#fefce8,stroke:#eab308,stroke-width:1px
    style SearchLayer fill:#ecfeff,stroke:#06b6d4,stroke-width:1px
    style BlockchainLayer fill:#fdf2f8,stroke:#ec4899,stroke-width:1px
```

### Separation of Data & Trust Responsibilities

| Subsystem                       | Underlying Technology                               | Primary Responsibility                                                          | Immutability Guarantee                                                            |
| :------------------------------ | :-------------------------------------------------- | :------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------- |
| **Relational Metadata**   | PostgreSQL + Prisma ORM                             | Case metadata, users, organizational roles, ABAC overrides, physical handshakes | Protected via DB transactions & application authorization guards                  |
| **Evidence Binaries**     | Amazon S3                                           | Raw evidence binaries, disk dumps, PDF dossiers, high-res audio/video           | Encrypted at rest, S3 Versioning, isolated presigned URLs, S3 Object Lock         |
| **Full-Text & AI Search** | Elasticsearch 8 + Groq                              | OCR-extracted text, metadata query indexing, vector embeddings                  | Re-indexable replica cache synchronized from authoritative S3 & Postgres          |
| **Integrity Ledger**      | Hardhat EVM (Active) / Hyperledger Fabric (Roadmap) | SHA-256 content hashes, deterministic anchor IDs, custody events                | **Cryptographically irreversible**; tamper-proof against root DBAs & admins |

---

## 🔄 Evidence Cycles & Data Flow Diagrams

### 1. Evidence Ingestion & Anchoring Flow

Every digital document uploaded to SDEMS undergoes a rigorous 7-stage pipeline:

```mermaid
sequenceDiagram
    autonumber
    actor IO as Investigator / Forensic Officer
    participant API as SDEMS Backend API
    participant S3 as AWS S3 Storage
    participant OCR as OCR & Extraction Engine
    participant ES as Elasticsearch 8
    participant DB as PostgreSQL (Prisma)
    participant BC as Blockchain (EvidenceRegistry)

    IO->>API: 1. Upload File + Case ID + Metadata
    API->>API: 2. Check RBAC & ABAC Case Permissions
    API->>API: 3. Compute Deterministic SHA-256 Digest
    API->>S3: 4. Stream Binary to S3 (Versioned Key)
    S3-->>API: Confirm S3 Storage & ETag
    API->>DB: 5. Create Document & DocumentVersion Record
    par Async Processing & Indexing
        API->>OCR: Extract Text (Tesseract / PDF-Parse / Mammoth)
        OCR->>ES: Index Text & Vector Embeddings into ES Cluster
    and Blockchain Anchoring
        API->>BC: anchorEvidence(caseIdHash, docIdHash, sha256Hash, version)
        BC-->>BC: Calculate Keccak-256 AnchorID & Mint Anchor Event
        BC-->>API: Emit Tx Hash, Block Number & Block Timestamp
        API->>DB: Record BlockchainAnchor (CONFIRMED)
    end
    API->>DB: 6. Append-Only Audit Event (eventHash = SHA256(prevHash + payload))
    API-->>IO: 7. Return Verified Document Revision + Anchor Proof
```

### 2. Custody Handshake & Hash Verification Flow

Physical and digital evidence transfers require a strict **two-party handshake** to prevent repudiation or unaccounted handovers:

```mermaid
sequenceDiagram
    autonumber
    actor CustodianA as Current Custodian (Sender)
    participant API as SDEMS Backend API
    participant DB as PostgreSQL
    actor CustodianB as Receiving Custodian (Recipient)
    participant S3 as Amazon S3
    participant BC as Blockchain Registry

    CustodianA->>API: Initiate Transfer Request (Evidence ID, Recipient ID, Reason)
    API->>DB: Create CustodyTransfer (Status: PENDING)
    API->>DB: Append-Only Audit Log: CUSTODY_TRANSFER_INITIATED
    API-->>CustodianB: Transfer Notification

    alt Recipient Accepts Transfer
        CustodianB->>API: Accept Custody Handshake
        API->>S3: Retrieve Evidence Binary
        API->>API: Recalculate On-the-Fly SHA-256 Checksum
        API->>BC: Query On-Chain Anchor Record for SHA-256 Hash
        API->>API: Compare Checksums (Recalculated vs. On-Chain)
        alt Checksums Match (Integrity Verified)
            API->>DB: Update Evidence.currentCustodianId = CustodianB
            API->>DB: Update CustodyTransfer.status = ACCEPTED
            API->>DB: Create CustodyEvent (Sequence++, Handover Record)
            API->>DB: Append-Only Audit Log: CUSTODY_TRANSFER_ACCEPTED
            API-->>CustodianB: Custody Acknowledged & Integrity Certified ✅
            API-->>CustodianA: Transfer Confirmed Complete ✅
        else Checksum Mismatch (Tampering Detected)
            API->>DB: Update CustodyTransfer.status = REJECTED (Integrity Failure)
            API->>DB: Critical Alert Audit Log: TAMPER_DETECTED
            API-->>CustodianB: Transfer Aborted: Tampering Detected! ❌
        end
    else Recipient Rejects
        CustodianB->>API: Reject Transfer (Reason)
        API->>DB: Update CustodyTransfer.status = REJECTED
        API->>DB: Append-Only Audit Log: CUSTODY_TRANSFER_REJECTED
        API-->>CustodianA: Custody Transfer Declined ❌
    end
```

### 3. Append-Only Cryptographic Audit Trail

Every state-modifying action within a case writes an immutable event to the `AuditEvent` table. Each event links to the previous event via cryptographic hash chaining:

```mermaid
graph LR
    subgraph "Case Genesis"
        E0["Event 0: CASE_CREATED<br>seq: 0<br>prevHash: NULL<br>hash: SHA256(...)"]
    end
    subgraph "Document Revision"
        E1["Event 1: DOCUMENT_CREATED<br>seq: 1<br>prevHash: Hash(E0)<br>hash: SHA256(prevHash + payload)"]
    end
    subgraph "Custody Transfer"
        E2["Event 2: CUSTODY_TRANSFER<br>seq: 2<br>prevHash: Hash(E1)<br>hash: SHA256(prevHash + payload)"]
    end
    subgraph "Integrity Verification"
        E3["Event 3: EVIDENCE_VERIFIED<br>seq: 3<br>prevHash: Hash(E2)<br>hash: SHA256(prevHash + payload)"]
    end

    E0 --> E1
    E1 --> E2
    E2 --> E3

    style E0 fill:#dbeafe,stroke:#3b82f6,stroke-width:1px,color:#1f2937
    style E1 fill:#dbeafe,stroke:#3b82f6,stroke-width:1px,color:#1f2937
    style E2 fill:#dbeafe,stroke:#3b82f6,stroke-width:1px,color:#1f2937
    style E3 fill:#dcfce7,stroke:#22c55e,stroke-width:2px,color:#1f2937
```

When an auditor or judge accesses `/api/cases/:caseId/audit/verify`, the backend traverses the chain from sequence `0` to `N`, recomputing every hash in real time. **If any record has been modified or deleted by an insider, the chain immediately breaks.**

---

## 🛠️ Technical Stack & Component Breakdown

```text
+-----------------------------------------------------------------------------------------+
|                                    TECHNOLOGY STACK                                     |
+---------------------+-----------------------------+-------------------------------------+
| CATEGORY            | ACTIVE WORKING DEPLOYMENT   | ENTERPRISE PRODUCTION TARGET        |
+---------------------+-----------------------------+-------------------------------------+
| Frontend            | React 19, TypeScript, Vite, | React 19, Vite, Tailwind CSS,       |
|                     | Tailwind CSS 4, Redux Toolkit| WebCrypto API Client Signing       |
+---------------------+-----------------------------+-------------------------------------+
| Backend API         | Node.js 20+, Express 5,     | Node.js Microservices, Express 5,   |
|                     | TypeScript, Zod, Multer     | Nginx Reverse Proxy, Docker Swarm   |
+---------------------+-----------------------------+-------------------------------------+
| Relational Database | PostgreSQL 15+, Prisma 6,   | AWS RDS Multi-AZ PostgreSQL,        |
|                     | 13 Relational Data Models   | Automated Snapshots & Encryption    |
+---------------------+-----------------------------+-------------------------------------+
| Object Storage      | Amazon S3 / S3-Mock Local   | AWS S3 GovCloud with Object Lock    |
|                     | Presigned URLs, Versioning  | Compliance Mode & Legal Hold        |
+---------------------+-----------------------------+-------------------------------------+
| Search & Extraction | Elasticsearch 8.13, Groq    | Distributed Elasticsearch Cluster,  |
|                     | Tesseract.js, Mammoth, PDF  | Sentence-Transformers Embeddings   |
+---------------------+-----------------------------+-------------------------------------+
| Blockchain Ledger   | Hardhat EVM Local Network,  | Hyperledger Fabric v2.5 / v3.0,     |
|                     | Solidity (EvidenceRegistry) | Fabric CA, Fabric Gateway, Raft     |
+---------------------+-----------------------------+-------------------------------------+
| Authentication      | JWT Bearer Tokens, Bcrypt   | Enterprise SAML 2.0 / OIDC SSO,     |
|                     | RBAC + Dynamic ABAC Engine  | Hardware TOTP / FIDO2 MFA Keys      |
+---------------------+-----------------------------+-------------------------------------+
```

---

## 🔒 Security, Cryptography & Legal Admissibility

### Solving the "DBA Dilemma"

In conventional database architectures, privileged Database Administrators (DBAs) or intruders with root access can execute SQL mutations:

```sql
-- The classic DBA Dilemma: Untraceable malicious modification
UPDATE "DocumentVersion" 
SET "sha256Hash" = 'FORGED_HASH_VAL' 
WHERE "id" = 'target_evidence_id';
```

Because DB logs can also be cleared or rewritten, traditional databases fail to provide courtroom-admissible non-repudiation.

**SDEMS eliminates this vulnerability through Blockchain Proof of Existence**:

1. When a document revision is finalized, its immutable metadata is registered on-chain.
2. The transaction receipt provides an unalterable block timestamp and block height.
3. If an attacker tampers with the PostgreSQL record or S3 object, any verification call performs a dual recalculation:
   $$
   \text{Hash}_{\text{Recalculated}} \neq \text{Hash}_{\text{On-Chain}} \implies \text{CRITICAL TAMPER DETECTED}
   $$

### Cryptographic Formulations

#### 1. Deterministic Anchor ID (Solidity / Smart Contract Layer)

$$
\text{anchorId} = \text{keccak256}\Big(\text{abi.encodePacked}(\text{caseIdHash}, \text{documentIdHash}, \text{versionNumber})\Big)
$$

#### 2. Append-Only Audit Hash (Audit Chain Layer)

$$
\text{eventHash}_n = \text{SHA-256}\Big(\text{caseId} + \text{eventType} + \text{actorId} + n + \text{previousHash}_{n-1} + \text{timestamp}\Big)
$$

#### 3. Content Fingerprint (Storage Layer)

$$
\text{contentHash} = \text{SHA-256}(\text{Binary Bytes of Document Version})
$$

### Zero-Trust Access Control (RBAC + ABAC)

Access evaluation follows an exhaustive four-tier policy pipeline before granting access to cases or evidence:

```mermaid
flowchart TD
    Req["Incoming API Request<br>(User, CaseId, Action)"] --> G1{"1. Is User Account<br>Active & Valid JWT?"}
    G1 -- No --> Deny["⛔ HTTP 401 Unauthorized"]
    G1 -- Yes --> G2{"2. Is User Assigned to<br>Case (CaseParticipant)?"}
    G2 -- No --> CheckSuper{"Is System<br>SUPER_ADMIN?"}
    CheckSuper -- No --> DenyCase["⛔ HTTP 403 Forbidden<br>(Not a Case Participant)"]
    CheckSuper -- Yes --> Allow["✅ HTTP 200 Allow Access"]
    G2 -- Yes --> G3{"3. Explicit ABAC Override?<br>(CasePermission Table)"}
    G3 -- "Explicit DENY Record" --> DenyABAC["⛔ HTTP 403 Forbidden<br>(Explicit ABAC Deny)"]
    G3 -- "Explicit GRANT Record" --> Allow
    G3 -- "No Specific Override" --> G4{"4. Check RBAC Role<br>(Admin / Investigator / Analyst)"}
    G4 -- Has Permission --> Allow
    G4 -- Missing Permission --> DenyRBAC["⛔ HTTP 403 Forbidden<br>(Insufficient Role Rights)"]

    style Deny fill:#fee2e2,stroke:#ef4444,stroke-width:1px
    style DenyCase fill:#fee2e2,stroke:#ef4444,stroke-width:1px
    style DenyABAC fill:#fee2e2,stroke:#ef4444,stroke-width:1px
    style DenyRBAC fill:#fee2e2,stroke:#ef4444,stroke-width:1px
    style Allow fill:#dcfce7,stroke:#22c55e,stroke-width:2px
```

---

## 📊 Current Implementation vs. Future Roadmap

To ensure total transparency between the working hackathon prototype and the production vision, here is a detailed feature status breakdown:

| Capability / Feature Area             | 🚀 Implemented & Fully Operational in Codebase                                                                                                                                                                                         | 🔮 Future Implementation & Enterprise Roadmap                                                                                                                                                                                |
| :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication & IAM**        | • JWT authentication with bcryptjs• Super Admin bootstrap script• Organization membership & role assignments                                                                                                                        | • Enterprise Single Sign-On (SAML 2.0 / OpenID Connect)• Multi-Factor Authentication (TOTP / FIDO2 WebAuthn)• Digilocker & Indian e-Pramaan ID integration                                                                |
| **Case & Evidence Vaults**      | • 13 Prisma relational models in PostgreSQL• Case creation, status lifecycle, tagging• Document versioning & S3 streaming• Physical item registration & metadata                                                                   | • Multi-region S3 replication with GovCloud compliance• Automatic court disposition schedules & legal destruction protocols                                                                                                |
| **Access Control (RBAC/ABAC)**  | • RBAC (Org Admin, Investigator, Analyst, Custodian, Legal Auditor)• ABAC dynamic `GRANT` & `DENY` case overrides• Strict `CaseParticipant` boundary checks                                                                   | • Contextual ABAC policies (IP subnet whitelisting, time-of-day access fences, geo-fencing for classified dossiers)                                                                                                         |
| **Blockchain Anchoring**        | • Solidity`EvidenceRegistry.sol` deployed on Hardhat• Deterministic `keccak256` anchor generation• Automatic transaction commitment on upload• Independent hash verification endpoint                                          | • Migration to**Hyperledger Fabric v2.5/v3.0** with Fabric CA & Fabric Gateway on AWS Managed Blockchain• Multi-agency endorsement policies across Police & Judiciary• Zero-gas institutional consortium governance |
| **Evidence Custody Handshake**  | • Dual-confirmation transfer request & accept flow• Rejection with mandatory audit reasoning• Sequential `CustodyEvent` chain linking                                                                                             | • Biometric fingerprint confirmation on physical handoff• QR/Barcode scanning integration for evidence locker tracking                                                                                                     |
| **Audit Trails & Verification** | • Append-only cryptographic hash chaining (`eventHash`)• Sequential integrity validation endpoint (`/audit/verify`)• Live discrepancy & tampering reporting                                                                     | • Periodic Merkle root checkpoint anchoring to national public ledger• RFC 3161 compliant cryptographic timestamping authorities                                                                                           |
| **AI, OCR & Semantic Search**   | • OCR text extraction using Tesseract.js (Images)• Native text extraction for PDF (`pdf-parse`) and DOCX (`mammoth`)• Elasticsearch 8 indexing & full-text query matching• Groq SDK Llama-3 AI query expansion & summarization | • Offline fine-tuned Indian legal BERT embeddings (e-Courts domain)• Automated redaction of personally identifiable information (PII) before external sharing                                                              |
| **Frontend Application**        | • Full React 19 + TypeScript + Vite + Tailwind CSS dashboard• 15 functional modules (Cases, Docs, Evidence, Custody, Verification, Audit, Users, Orgs, Reports, Settings)• Redux Toolkit state management & React Router 7          | • Native mobile application (React Native) for field officers to seize and hash evidence at physical crime scenes                                                                                                           |

---

## ⚖️ Feasibility, Viability & Mitigation Strategies

```text
+------------------------------------------------------------------------------------------------------------------+
|                                        RISK & MITIGATION MATRIX                                                  |
+-------------------------------+-----------------------------------------+----------------------------------------+
| CHALLENGE / RISK AREA         | OPERATIONAL RISK                        | ARCHITECTURAL MITIGATION               |
+-------------------------------+-----------------------------------------+----------------------------------------+
| Access Conflicts & Leaks      | Cross-agency unauthorized disclosure    | Enforce combined RBAC + ABAC guards    |
|                               | of sensitive intelligence.              | with organization & case isolation.   |
+-------------------------------+-----------------------------------------+----------------------------------------+
| Large Evidence Files          | Storing multi-gigabyte disk dumps on    | Hybrid storage: files stay in S3; only |
| (Disk Images, CCTV)           | blockchain causes chain bloat & failure.| 32-byte SHA-256 hashes go on-chain.    |
+-------------------------------+-----------------------------------------+----------------------------------------+
| Blockchain Latency & Fees     | Public network gas spikes and slow block| Permissioned network (Hardhat / Fabric)|
|                               | finality halt urgent police filings.   | with predictable latency & zero gas.   |
+-------------------------------+-----------------------------------------+----------------------------------------+
| Scanned / Degraded Records    | Critical case clues remain invisible    | Asynchronous OCR (Tesseract) + NLP     |
|                               | inside scanned handwritten or typed PDFs| indexing directly into Elasticsearch.  |
+-------------------------------+-----------------------------------------+----------------------------------------+
| Evidence Version Confusion    | Conflicting evidence copies presented   | Automated immutable version numbers    |
|                               | in court destroy prosecution claims.    | locked to unique content hashes.       |
+-------------------------------+-----------------------------------------+----------------------------------------+
| Untracked Physical Handoffs   | Seized physical items vanish or are     | Mandatory dual-party custody handshakes|
|                               | altered between police station & lab.   | with real-time audit chain logging.    |
+-------------------------------+-----------------------------------------+----------------------------------------+
| Privileged Deletion           | Root administrator deletes evidence or  | S3 Object Lock (Compliance Mode) +     |
|                               | drops PostgreSQL audit records.         | on-chain non-repudiable anchor blocks. |
+-------------------------------+-----------------------------------------+----------------------------------------+
| Inter-Agency Coordination     | Police, Labs, and Courts use different  | Permissioned Fabric consortium where   |
|                               | incompatible data schemes.              | each entity operates its own peer node.|
+-------------------------------+-----------------------------------------+----------------------------------------+
```

### Financial & Operational Feasibility

- **Cloud Storage Optimization**: Evidence files reside in Amazon S3 standard tier with automated lifecycle transitions to Glacier for inactive cases, reducing monthly storage overhead by over 70%.
- **Compute Efficiency**: Node.js and Express 5 provide high-throughput, non-blocking I/O handling thousands of concurrent case requests with modest CPU footprints.
- **Zero-Gas Economics**: Utilizing an institutional permissioned blockchain (Hyperledger Fabric / Private EVM) guarantees zero transaction fees, eliminating reliance on volatile cryptocurrency markets.

---

## 🏆 Competitive Benchmarking Matrix

| Feature / Capability                   |     SDEMS (Team ThreeSixNine)     |        C-DAC DEMS        |     eSakshya (NIC)     |      Axon Evidence      |
| :------------------------------------- | :-------------------------------: | :----------------------: | :---------------------: | :----------------------: |
| **Secure Evidence Storage**      |        ✅ S3 + Versioning        |    ✅ Central Server    |   ✅ Government Cloud   |      ✅ Azure Cloud      |
| **Chain-of-Custody Tracking**    |      ✅ Dual-Party Handshake      |    ⚠️ Basic DB Log    | ⚠️ Procedural Manual |    ✅ Proprietary Log    |
| **Evidence Search & Retrieval**  |    ✅ Elasticsearch + OCR + AI    |  ⚠️ Keyword Metadata  |   ⚠️ Basic Case ID   |  ✅ Video Transcription  |
| **Access Control (RBAC + ABAC)** |     ✅ Fine-Grained Dual Tier     |   ⚠️ Role-Based Only   | ⚠️ Departmental Roles |    ✅ Role-Based Only    |
| **Immutable File Versioning**    |     ✅ Cryptographic SHA-256     | ⚠️ Filename Versioning | ⚠️ Sequential Numbers |    ✅ File Checksums    |
| **Independent Verification**     |    ✅ Open Cryptographic Math    |  ❌ Proprietary Portal  |    ❌ Internal Only    |  ❌ Axon Platform Only  |
| **Blockchain Anchor Proof**      |     ✅ EVM (Active) / Fabric     |         ❌ None         |  ⚠️ Pilot Evaluation  |         ❌ None         |
| **Blockchain Custody Logs**      |    ✅ Tamper-Proof Audit Chain    |         ❌ None         |         ❌ None         |         ❌ None         |
| **Physical + Digital Tracking**  |        ✅ Unified Workflow        |   ❌ Digital Documents   | ⚠️ Digital Recordings |  ⚠️ Hardware Tagging  |
| **Case Lifecycle Management**    | ✅ Complete (Open$\to$ Archive) |   ✅ Document Oriented   |   ⚠️ Trial Focused   | ✅ Investigation Centric |

---

## 🌟 Impact & Stakeholder Benefits

> *"A conventional DMS manages documents. Our platform proves the trust, lifecycle, and cryptographic provenance of evidence."*

```text
+-------------------------------------------------------------------------------------------------------------+
|                                           STAKEHOLDER BENEFIT MATRIX                                        |
+--------------------------+----------------------------------------------------------------------------------+
| STAKEHOLDER              | KEY VALUE DELIVERED BY SDEMS                                                     |
+--------------------------+----------------------------------------------------------------------------------+
| 🔬 Forensic Examiner     | Ingest raw disk images/reports, receive instant SHA-256 certificates, and         |
|                          | document scientific examination steps without risk of retroactive claims.        |
+--------------------------+----------------------------------------------------------------------------------+
| ⚖️ Judicial Officer      | Independently verify evidence authenticity without trusting police IT admins,    |
|                          | review transparent custody handshakes, and verify Section 65B compliance.        |
+--------------------------+----------------------------------------------------------------------------------+
| 🛡️ Organization Admin    | Manage officers, roles, and departmental boundaries without possessing          |
|                          | the power to alter or erase evidence files or audit trails.                      |
+--------------------------+----------------------------------------------------------------------------------+
| 🔍 Compliance Auditor    | Reconstruct chronological case activity across users and organizations in seconds|
|                          | using automated hash-chain verification endpoints.                               |
+--------------------------+----------------------------------------------------------------------------------+
| 👮 Investigating Officer | Search across thousands of scanned PDFs and crime scene photos instantly with    |
|                          | full-text OCR, and seamlessly transfer evidence to forensic labs.                |
+--------------------------+----------------------------------------------------------------------------------+
| 🏛️ Government Consortium | Enable unified evidence continuity between Police, Prosecution, and Courts      |
|                          | aligned with the national Inter-Operable Criminal Justice System (ICJS).        |
+--------------------------+----------------------------------------------------------------------------------+
```

---

## 📚 Research Citations & Scientific References

1. **NIST IR 8387 (2022)** - *Digital Evidence Preservation and Chain of Custody Integrity*. National Institute of Standards and Technology.
2. **Meral, M., & Sayan, B. (2025)** - *DFIRChain: A Distributed Ledger Framework for Tamper-Resistant Digital Forensics and Incident Response*. Journal of Information Security and Applications.
3. **Sathyaprakasan, P., et al. (2021)** - *Blockchain in Forensic Evidence Management: Solving the Admissibility Dilemma in Modern Jurisdictions*. IEEE Access, 9, 112340-112355.
4. **AlKhanafseh, M., & Surakhi, O. (2024)** - *Cryptographic Assurance and Provenance in Digital Evidence Preservation Systems*. Forensic Science International: Digital Investigation.
5. **Wang, H., & Zhang, Y. (2019)** - *Blockchain-Based Data Integrity Verification for Secure Cloud Storage Systems*. IEEE Transactions on Cloud Computing.
6. **Kamal, M., et al. (2022)** - *Forensics Chain: An Auditable and Decentralized Framework for Forensic Evidence Management*. Future Generation Computer Systems, 134, 45-60.
7. **Ministry of Home Affairs (MHA), Government of India** - *Inter-Operable Criminal Justice System (ICJS) Architecture and Standards*.
8. **e-Committee, Supreme Court of India** - *Digital Filing & Electronic Record Standards for Indian Courts*.

---

## 📁 Repository Structure

```text
sdems-evidence-management-system/
├── README.md                      # Comprehensive SIH Project Documentation & Architectural Blueprint
├── docker-compose.elastic.yml     # Standalone Docker Compose for Elasticsearch 8 Cluster
│
├── backend/                       # Node.js + Express 5 + TypeScript REST Backend
│   ├── blockchain/                # Blockchain Smart Contracts & Deployment Scripts
│   │   ├── contracts/             # EvidenceRegistry.sol (Solidity Anchor Registry)
│   │   ├── scripts/               # Hardhat Local Deployment & Verification Scripts
│   │   └── hardhat.config.ts      # Hardhat Network Settings
│   │
│   ├── prisma/                    # PostgreSQL ORM Layer
│   │   ├── schema.prisma          # 13 Relational Data Models (Cases, Docs, Custody, Audit, etc.)
│   │   └── seed.ts / seed.js      # System Roles, Permissions & Bootstrap Seed
│   │
│   ├── src/                       # TypeScript Source Code
│   │   ├── config/                # Swagger OpenAPI Specs & Environment Validations
│   │   ├── middleware/            # Auth, ABAC/RBAC, Multer File Upload & Error Handlers
│   │   ├── modules/               # Domain-Driven Feature Modules
│   │   │   ├── audit/             # Append-only hash chain audit trail & verify logic
│   │   │   ├── auth/              # JWT issuance, login, and registration routes
│   │   │   ├── authorization/     # Dynamic ABAC permission management & access requests
│   │   │   ├── blockchain/        # Ethers.js smart contract anchor bridge & hash verification
│   │   │   ├── cases/             # Case vault lifecycle & participant assignments
│   │   │   ├── documents/         # Document versioning & S3 streaming upload/download
│   │   │   ├── evidence/          # Physical/digital evidence registration & custody handshakes
│   │   │   ├── organizations/     # Multi-tenant organization bootstrap & management
│   │   │   └── search/            # Elasticsearch, Tesseract OCR, PDF/Docx parsers, Groq LLM
│   │   ├── utils/                 # Hashing algorithms, JWT wrappers, S3 client helpers
│   │   ├── app.ts                 # Express application mount point
│   │   └── server.ts              # HTTP server entrypoint
│   │
│   ├── API_TESTING_GUIDE.md       # Interactive 8 User-Story Testing Walkthrough
│   ├── CODEBASE_ANALYSIS.md       # Detailed Technical Architectural Analysis
│   ├── SETUP_GUIDE.md             # Development Environment Setup Guide
│   └── test_all_endpoints.cjs     # Automated 26-endpoint API test runner
│
└── frontend/                      # React 19 + TypeScript + Vite + Tailwind CSS Application
    ├── src/
    │   ├── components/            # Layout, Navigation, Buttons, Cards, UI Modals
    │   ├── config/                # Routes & API Endpoint Configurations
    │   ├── modules/               # Modular Feature Pages
    │   │   ├── audit/             # Audit Trail Browser & Chain Verifier UI
    │   │   ├── auth/              # Modern Authentication & Login View
    │   │   ├── authorization/     # Access Request Approvals & ABAC Manager
    │   │   ├── blockchain/        # On-Chain Anchor Inspector & Explorer
    │   │   ├── cases/             # Case Vault Directory & Case Detail View
    │   │   ├── custody/           # Custody Handshake Initiation & Handover Dashboard
    │   │   ├── dashboard/         # Executive Case Metrics & Status Overview
    │   │   ├── documents/         # Document Repository & Version History Viewer
    │   │   ├── evidence/          # Evidence Catalog & Digital/Physical Inspector
    │   │   ├── organizations/     # Multi-Tenant Organization Switcher & Directory
    │   │   ├── reports/           # Courtroom Dossier & Forensic Certificate Export
    │   │   ├── settings/          # System Configuration & Preferences
    │   │   ├── users/             # User Management & RBAC Role Assigner
    │   │   └── verification/      # Independent SHA-256 Hash Verification Tool
    │   ├── router/                # React Router v7 Protected & Public Route Guards
    │   ├── store/                 # Redux Toolkit Global State Slices
    │   ├── App.tsx                # Main Application Shell
    │   └── main.tsx               # Client Root Mount
    └── package.json               # Frontend Dependencies & Scripts
```

---

## 🚀 Local Setup & Quick Start Guide

### Prerequisites

- **Node.js**: `v20.x` or higher
- **Docker & Docker Compose**: Installed and active
- **PostgreSQL**: Local server or cloud instance (e.g. Supabase, AWS RDS)
- **Git**: Installed

---

### Step 1: Clone Repository

```bash
git clone https://github.com/MasirJafri1/sdems-evidence-management-system.git
cd sdems-evidence-management-system
```

---

### Step 2: Configure Environment Variables

Create `backend/.env`:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sdems_db?schema=public"

# Authentication
JWT_SECRET="sdems_super_secret_jwt_key_2026_min_32_chars"

# Server Port
PORT=5000
NODE_ENV="development"

# Storage Settings (AWS S3 or Local Mock)
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="test_access_key"
AWS_SECRET_ACCESS_KEY="test_secret_key"
S3_BUCKET_NAME="sdems-secure-evidence-vault"

# Blockchain Node (Hardhat Local Node Defaults)
BLOCKCHAIN_RPC_URL="http://127.0.0.1:8545"
BLOCKCHAIN_CHAIN_ID=31337
BLOCKCHAIN_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
BLOCKCHAIN_CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"

# Elasticsearch
ELASTICSEARCH_NODE="http://localhost:9200"

# Optional: Groq AI Semantic Expansion
GROQ_API_KEY=""
```

---

### Step 3: Start Elasticsearch Cluster (Docker)

```bash
docker compose -f docker-compose.elastic.yml up -d
```

Verify cluster health:

```bash
curl http://localhost:9200/_cluster/health
```

---

### Step 4: Setup Backend, Database & Smart Contracts

```bash
cd backend
npm install

# Run Prisma schema migrations & initial seeds
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Install blockchain dependencies
cd blockchain
npm install
cd ..
```

---

### Step 5: Launch Blockchain & Deploy Smart Contract

**Terminal 1 (Start Local EVM Node):**

```bash
cd backend
npm run blockchain:node
```

**Terminal 2 (Deploy Contract):**

```bash
cd backend
npm run blockchain:deploy
```

*(Copy the deployed contract address into your `backend/.env` file under `BLOCKCHAIN_CONTRACT_ADDRESS` if different from default)*.

---

### Step 6: Start Backend API Server

```bash
cd backend
npm run dev
```

The server will start on **`http://localhost:5000`**.
Interactive Swagger OpenAPI documentation is accessible at:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

---

### Step 7: Launch Frontend Application

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on **`http://localhost:5173`**.

---

## 🧪 Automated Testing & API Verification

SDEMS includes an end-to-end automated test runner (`backend/test_all_endpoints.cjs`) that tests all 26 core API endpoints across user bootstrapping, multi-tenant authentication, case vault isolation, document versioning, blockchain proof verification, custody handshakes, and cryptographic audit chain validation:

```bash
cd backend
node test_all_endpoints.cjs
```

### Verified Test Output

```text
=================================================
   AUTOMATED ALL-ENDPOINTS SWAGGER API TESTER  
=================================================

✅ PASS | Health Check [GET /health] -> Status 200
✅ PASS | Bootstrap System [POST /api/organizations/bootstrap] -> Status 201
✅ PASS | Admin Login [POST /api/auth/login] -> Status 200
✅ PASS | Get Current User [GET /api/auth/me] -> Status 200
✅ PASS | List Organizations [GET /api/organizations] -> Status 200
✅ PASS | Create Role [POST /api/organizations/:id/roles] -> Status 201
✅ PASS | Create Case Vault [POST /api/cases] -> Status 201
✅ PASS | List Cases [GET /api/cases] -> Status 200
✅ PASS | Add Participant [POST /api/cases/:id/participants] -> Status 201
✅ PASS | Upload Evidence Document [POST /api/cases/:id/documents] -> Status 201
✅ PASS | Upload New Version [POST /api/documents/:id/versions] -> Status 201
✅ PASS | Blockchain Anchor Fetch [GET /api/document-versions/:id/blockchain] -> Status 200
✅ PASS | Blockchain Cryptographic Verify [GET /api/document-versions/:id/verify] -> Status 200
✅ PASS | Register Physical Evidence [POST /api/cases/:id/evidence] -> Status 201
✅ PASS | Initiate Custody Handshake [POST /api/evidence/:id/custody/transfer] -> Status 201
✅ PASS | Accept Custody Handshake [POST /api/custody/transfers/:id/respond] -> Status 200
✅ PASS | Verify Case Audit Chain [GET /api/cases/:id/audit/verify] -> Status 200
...
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

<div align="center">
  <sub>Smart India Hackathon 2026 • Problem Statement ID: 26190 • Developed with pride by <b>Team ThreeSixNine</b></sub>
</div>
