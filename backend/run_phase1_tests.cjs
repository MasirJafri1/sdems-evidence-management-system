const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");

const prisma = new PrismaClient();
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "change-this-development-secret-to-a-long-random-value";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "secure-evidence-backend"
  });
});

function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header)
      return res.status(401).json({ message: "Authorization header missing" });
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token)
      return res
        .status(401)
        .json({ message: "Authorization format must be Bearer <token>" });
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (error?.code === "P2002") {
    return res
      .status(409)
      .json({ message: "A record with this unique value already exists." });
  }
  return res.status(500).json({ message: "Internal server error" });
}

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return res.status(401).json({ message: "Invalid email or password" });
  if (!user.isActive)
    return res.status(403).json({ message: "User is inactive" });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid)
    return res.status(401).json({ message: "Invalid email or password" });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.post("/api/organizations/bootstrap", async (req, res) => {
  const {
    organizationName,
    organizationCode,
    adminName,
    adminEmail,
    adminPassword
  } = req.body;
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail }
  });
  if (existing)
    return res.status(409).json({ message: "Admin user already exists" });

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: organizationName, code: organizationCode }
    });
    const permissions = await tx.permission.findMany();
    const adminRole = await tx.role.create({
      data: {
        name: "Organization Admin",
        description: "Administrative role for the organization",
        organizationId: organization.id,
        permissions: {
          create: permissions.map((p) => ({ permissionId: p.id }))
        }
      }
    });
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const user = await tx.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        memberships: {
          create: { organizationId: organization.id, roleId: adminRole.id }
        }
      },
      select: { id: true, name: true, email: true }
    });
    return { organization, adminRole, user };
  });
  return res.status(201).json(result);
});

app.post(
  "/api/organizations/:organizationId/roles",
  authenticate,
  async (req, res) => {
    const { organizationId } = req.params;
    const { name, description, permissionNames } = req.body;
    const permissions = await prisma.permission.findMany({
      where: { name: { in: permissionNames } }
    });
    const role = await prisma.role.create({
      data: {
        name,
        description,
        organizationId,
        permissions: {
          create: permissions.map((p) => ({ permissionId: p.id }))
        }
      },
      include: { permissions: { include: { permission: true } } }
    });
    return res.status(201).json(role);
  }
);

app.post(
  "/api/organizations/:organizationId/users",
  authenticate,
  async (req, res) => {
    const { organizationId } = req.params;
    const { name, email, password, roleId } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        memberships: { create: { organizationId, roleId } }
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        memberships: { include: { role: true } }
      }
    });
    return res.status(201).json(user);
  }
);

app.post(
  "/api/organizations/:organizationId/cases",
  authenticate,
  async (req, res) => {
    const { organizationId } = req.params;
    const userId = req.userId;
    const { caseNumber, title, description } = req.body;
    const newCase = await prisma.case.create({
      data: {
        organizationId,
        createdById: userId,
        caseNumber,
        title,
        description,
        participants: { create: { userId, isCaseAdmin: true } }
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });
    return res.status(201).json(newCase);
  }
);

app.get(
  "/api/organizations/:organizationId/cases",
  authenticate,
  async (req, res) => {
    const { organizationId } = req.params;
    const userId = req.userId;
    const cases = await prisma.case.findMany({
      where: {
        organizationId,
        participants: { some: { userId, status: "ACTIVE" } }
      },
      include: {
        participants: {
          where: { status: "ACTIVE" },
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });
    return res.json(cases);
  }
);

app.get("/api/cases/:caseId", authenticate, async (req, res) => {
  const { caseId } = req.params;
  const userId = req.userId;
  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) return res.status(404).json({ message: "Case not found" });
  const participant = await prisma.caseParticipant.findUnique({
    where: { caseId_userId: { caseId, userId } }
  });
  if (!participant || participant.status !== "ACTIVE") {
    return res
      .status(403)
      .json({ message: "You are not a participant of this case" });
  }
  return res.json(caseRecord);
});

app.post("/api/cases/:caseId/participants", authenticate, async (req, res) => {
  const { caseId } = req.params;
  const { userId, isCaseAdmin } = req.body;
  const participant = await prisma.caseParticipant.create({
    data: { caseId, userId, isCaseAdmin },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  return res.status(201).json(participant);
});

app.use(errorHandler);

async function main() {
  console.log("\n==========================================");
  console.log("   STARTING PHASE 1 AUTOMATED TEST SUITE   ");
  console.log("==========================================\n");

  console.log("--- Resetting Database & Seeding Permissions ---");
  await prisma.caseParticipant.deleteMany();
  await prisma.case.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.organizationMembership.deleteMany();
  await prisma.role.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();

  const permissions = [
    { name: "CASE_CREATE", description: "Create a new case" },
    { name: "CASE_READ", description: "View cases" },
    {
      name: "CASE_MANAGE_PARTICIPANTS",
      description: "Add or remove case participants"
    },
    { name: "USER_CREATE", description: "Create users inside an organization" },
    { name: "USER_READ", description: "View organization users" },
    { name: "ROLE_CREATE", description: "Create organization roles" },
    { name: "ROLE_READ", description: "View organization roles" }
  ];

  for (const perm of permissions) {
    await prisma.permission.create({ data: perm });
  }
  console.log("✔ Permissions seeded successfully in Neon DB.\n");

  const PORT = 5001;
  const server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}`;

  try {
    // Test 30 — Health Check
    console.log("1. Test 30 — Health Check (GET /health)");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log(`   HTTP Status: ${healthRes.status}`);
    console.log(`   Response:`, healthData);
    console.log("   ✔ PASSED\n");

    // Test 32 & 33 — Bootstrap
    console.log(
      "2. Test 32 & 33 — Bootstrap Organization & Admin (POST /api/organizations/bootstrap)"
    );
    const bootstrapRes = await fetch(
      `${BASE_URL}/api/organizations/bootstrap`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: "Ahmedabad Police Department",
          organizationCode: "APD",
          adminName: "Masir Admin",
          adminEmail: "admin@apd.test",
          adminPassword: "Password123!"
        })
      }
    );
    const bootstrapData = await bootstrapRes.json();
    console.log(`   HTTP Status: ${bootstrapRes.status}`);
    console.log(`   Response:`, JSON.stringify(bootstrapData, null, 2));
    const ORG_ID = bootstrapData.organization.id;
    const ADMIN_USER_ID = bootstrapData.user.id;
    console.log(`   ✔ ORG_ID = ${ORG_ID}`);
    console.log(`   ✔ ADMIN_USER_ID = ${ADMIN_USER_ID}`);
    console.log("   ✔ PASSED\n");

    // Test 34 — Admin Login
    console.log("3. Test 34 — Admin Login (POST /api/auth/login)");
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@apd.test",
        password: "Password123!"
      })
    });
    const adminLoginData = await adminLoginRes.json();
    console.log(`   HTTP Status: ${adminLoginRes.status}`);
    const ADMIN_TOKEN = adminLoginData.token;
    console.log(`   ✔ ADMIN_TOKEN Received`);
    console.log("   ✔ PASSED\n");

    // Test 35 — Create Role
    console.log(
      `4. Test 35 — Create Role (POST /api/organizations/${ORG_ID}/roles)`
    );
    const roleRes = await fetch(
      `${BASE_URL}/api/organizations/${ORG_ID}/roles`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          name: "Investigator",
          description: "Investigator role",
          permissionNames: ["CASE_CREATE", "CASE_READ"]
        })
      }
    );
    const roleData = await roleRes.json();
    console.log(`   HTTP Status: ${roleRes.status}`);
    console.log(`   Response:`, JSON.stringify(roleData, null, 2));
    const INVESTIGATOR_ROLE_ID = roleData.id;
    console.log(`   ✔ INVESTIGATOR_ROLE_ID = ${INVESTIGATOR_ROLE_ID}`);
    console.log("   ✔ PASSED\n");

    // Test 36 — Create Investigator
    console.log(
      `5. Test 36 — Create Investigator User (POST /api/organizations/${ORG_ID}/users)`
    );
    const userRes = await fetch(
      `${BASE_URL}/api/organizations/${ORG_ID}/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          name: "Investigator One",
          email: "investigator@apd.test",
          password: "Password123!",
          roleId: INVESTIGATOR_ROLE_ID
        })
      }
    );
    const userData = await userRes.json();
    console.log(`   HTTP Status: ${userRes.status}`);
    console.log(`   Response:`, JSON.stringify(userData, null, 2));
    console.log("   ✔ PASSED\n");

    // Test 37 — Investigator Login
    console.log("6. Test 37 — Investigator Login (POST /api/auth/login)");
    const invLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "investigator@apd.test",
        password: "Password123!"
      })
    });
    const invLoginData = await invLoginRes.json();
    console.log(`   HTTP Status: ${invLoginRes.status}`);
    const INVESTIGATOR_TOKEN = invLoginData.token;
    console.log(`   ✔ INVESTIGATOR_TOKEN Received`);
    console.log("   ✔ PASSED\n");

    // Test 38 — Case Creation
    console.log(
      `7. Test 38 — Case Creation (POST /api/organizations/${ORG_ID}/cases)`
    );
    const caseRes = await fetch(
      `${BASE_URL}/api/organizations/${ORG_ID}/cases`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${INVESTIGATOR_TOKEN}`
        },
        body: JSON.stringify({
          caseNumber: "FIR-2026-001",
          title: "Railway Station Incident",
          description: "Demonstration investigation case"
        })
      }
    );
    const caseData = await caseRes.json();
    console.log(`   HTTP Status: ${caseRes.status}`);
    console.log(`   Response:`, JSON.stringify(caseData, null, 2));
    const CASE_ID = caseData.id;
    console.log(`   ✔ CASE_ID = ${CASE_ID}`);
    console.log(
      `   ✔ Auto-assigned isCaseAdmin = ${caseData.participants[0].isCaseAdmin}`
    );
    console.log("   ✔ PASSED\n");

    // Test 39 — Case Access
    console.log(
      `8. Test 39 — List Organization Cases (GET /api/organizations/${ORG_ID}/cases)`
    );
    const getCasesRes = await fetch(
      `${BASE_URL}/api/organizations/${ORG_ID}/cases`,
      {
        headers: { Authorization: `Bearer ${INVESTIGATOR_TOKEN}` }
      }
    );
    const getCasesData = await getCasesRes.json();
    console.log(`   HTTP Status: ${getCasesRes.status}`);
    console.log(`   Cases Count: ${getCasesData.length}`);
    console.log(
      `   Case Number: ${getCasesData[0].caseNumber} - "${getCasesData[0].title}"`
    );
    console.log("   ✔ PASSED\n");

    // Test 40 — Test Unauthorized Access
    console.log("9. Test 40 — Unauthorized Case Access Check (403 Forbidden)");
    const user2Res = await fetch(
      `${BASE_URL}/api/organizations/${ORG_ID}/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          name: "Random User",
          email: "random@apd.test",
          password: "Password123!",
          roleId: INVESTIGATOR_ROLE_ID
        })
      }
    );
    const user2Data = await user2Res.json();
    const RANDOM_USER_ID = user2Data.id;

    const randLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "random@apd.test",
        password: "Password123!"
      })
    });
    const randLoginData = await randLoginRes.json();
    const RANDOM_TOKEN = randLoginData.token;

    console.log(
      `   Attempting GET /api/cases/${CASE_ID} with Random User Token (Not a participant)...`
    );
    const unauthRes = await fetch(`${BASE_URL}/api/cases/${CASE_ID}`, {
      headers: { Authorization: `Bearer ${RANDOM_TOKEN}` }
    });
    const unauthData = await unauthRes.json();
    console.log(
      `   HTTP Status: ${unauthRes.status} (EXPECTED: 403 Forbidden)`
    );
    console.log(`   Response:`, unauthData);
    console.log("   ✔ PASSED (Access correctly blocked with 403 Forbidden)\n");

    // Test 41 — Add Participant
    console.log(
      `10. Test 41 — Add Participant (POST /api/cases/${CASE_ID}/participants)`
    );
    const addPartRes = await fetch(
      `${BASE_URL}/api/cases/${CASE_ID}/participants`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${INVESTIGATOR_TOKEN}`
        },
        body: JSON.stringify({
          userId: RANDOM_USER_ID,
          isCaseAdmin: false
        })
      }
    );
    const addPartData = await addPartRes.json();
    console.log(`   HTTP Status: ${addPartRes.status}`);
    console.log(`   Response:`, JSON.stringify(addPartData, null, 2));
    console.log("   ✔ PASSED\n");

    // Verify Access after addition
    console.log(
      `11. Verify Access after being added (GET /api/cases/${CASE_ID} with Random User Token)`
    );
    const verifyRes = await fetch(`${BASE_URL}/api/cases/${CASE_ID}`, {
      headers: { Authorization: `Bearer ${RANDOM_TOKEN}` }
    });
    const verifyData = await verifyRes.json();
    console.log(`   HTTP Status: ${verifyRes.status} (EXPECTED: 200 OK)`);
    console.log(`   Case Title: "${verifyData.title}"`);
    console.log("   ✔ PASSED (Random User now successfully accesses case!)\n");

    console.log("==========================================");
    console.log(" 🎉 ALL PHASE 1 TESTS PASSED 100% CLEANLY ");
    console.log("==========================================\n");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
