# Secure Digital Document & Evidence Management System - Setup Guide

This guide provides step-by-step instructions for setting up, configuring, and starting the **Secure Digital Document & Evidence Management System**, including PostgreSQL database migrations, local Hardhat blockchain network startup, smart contract deployment, and running the backend API server.

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.x or higher (v20+ recommended)
- **npm**: v9.x or higher
- **PostgreSQL**: Local PostgreSQL instance OR a cloud PostgreSQL database (e.g. Neon PostgreSQL, Supabase, Railway, AWS RDS)
- **Git**

---

## 📁 Repository Structure

```text
sih_ps1/
└── backend/
    ├── blockchain/          # Hardhat Smart Contracts & Deployment Scripts
    ├── prisma/              # Prisma Database Schema & Seed Scripts
    ├── src/                 # Express API Backend Source Code
    │   ├── config/          # Swagger OpenAPI Spec & Configuration
    │   ├── middleware/      # Auth, Upload, and Error Middlewares
    │   └── modules/         # Feature Modules (Auth, Cases, Documents, Evidence, etc.)
    ├── API_TESTING_GUIDE.md # User Story API Testing Guide via Swagger
    └── SETUP_GUIDE.md       # Environment Setup & Deployment Instructions
```

---

## ⚙️ Step-by-Step Setup Instructions

### Step 1: Install Dependencies

Navigate to the `backend` directory and install the Node.js packages:

```bash
cd backend
npm install
```

Also install dependencies in the inner `blockchain` directory:

```bash
cd blockchain
npm install
cd ..
```

---

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Open `backend/.env` and configure the following parameters:

```env
# Database Connection URL (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/evidence_db?sslmode=disable"

# JWT Authentication Secret Key
JWT_SECRET="super-secret-jwt-key-change-in-production-2026"

# Server Port & Environment
PORT=5000
NODE_ENV="development"

# AWS S3 Storage Settings (Or Local S3 Compatible Mock / Local Uploads)
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_KEY"
S3_BUCKET_NAME="secure-evidence-dev"

# Blockchain Configuration (Hardhat Local Network Defaults)
BLOCKCHAIN_RPC_URL="http://127.0.0.1:8545"
BLOCKCHAIN_CHAIN_ID="31337"
BLOCKCHAIN_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
BLOCKCHAIN_CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
```

---

### Step 3: Run Database Migrations & Seed Initial Data

Run Prisma database migrations to create all required tables (Users, Organizations, Roles, Cases, Documents, Physical Evidence, Custody Logs, Audit Chains, Authorization Overrides):

```bash
# Generate Prisma Client
npm run prisma:generate

# Execute Database Migration
npm run prisma:migrate

# (Optional) Seed Default Initial Data
npm run prisma:seed
```

---

### Step 4: Start Hardhat Local Blockchain Network

Open a **separate terminal window** in the `backend/` directory and start the local Ethereum testnet node:

```bash
npm run blockchain:node
```

> 💡 **Note**: Hardhat will launch on `http://127.0.0.1:8545` and provide 20 pre-funded test accounts with private keys.

---

### Step 5: Compile & Deploy Smart Contracts

In your primary terminal window (backend directory), compile and deploy the `EvidenceRegistry` smart contract to your local Hardhat node:

```bash
# Compile Smart Contracts
npm run blockchain:compile

# Deploy EvidenceRegistry Contract to Local Node
npm run blockchain:deploy
```

Upon successful deployment, the terminal will output the deployed contract address:
```text
Deploying EvidenceRegistry...
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
EvidenceRegistry: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Chain ID: 31337
Deployment saved to deployments/localhost/EvidenceRegistry.json
```

If the deployed contract address is different from your `.env` value, copy the new address and update `BLOCKCHAIN_CONTRACT_ADDRESS` in `backend/.env`.

---

### Step 6: Start the Backend API Server

Now launch the Express backend application in development mode:

```bash
npm run dev
```

The server will start listening on port `5000`:
```text
[INFO] Server running on http://localhost:5000
[INFO] Swagger UI available at http://localhost:5000/api-docs
```

---

## 🧪 Verifying Your Setup

1. **Health Check**:
   Open your browser or run:
   ```bash
   curl http://localhost:5000/health
   ```
   *Expected Response*: `{"status":"ok","service":"secure-evidence-backend","phase":6}`

2. **Swagger UI**:
   Navigate to:
   👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

Now follow the [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md) to test every API endpoint end-to-end!
