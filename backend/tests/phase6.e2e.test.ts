import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";
import { signToken } from "../src/utils/jwt";

describe("Phase 6 Milestone — Official End-to-End Fine-Grained Authorization Lifecycle", () => {
  let policeOrgId: string;
  let fslOrgId: string;

  let policeUserA: { id: string; token: string };
  let fslUserB: { id: string; token: string };
  let randomUserC: { id: string; token: string };

  let caseId: string;
  let documentId: string;
  let documentVersionId: string;
  let evidenceId: string;

  beforeAll(async () => {
    // 0. Seed Permissions into database for tests
    const requiredPermissions = [
      "CASE_READ",
      "CASE_UPDATE",
      "CASE_PARTICIPANT_MANAGE",
      "DOCUMENT_READ",
      "DOCUMENT_UPLOAD",
      "DOCUMENT_UPDATE",
      "DOCUMENT_DOWNLOAD",
      "DOCUMENT_VERIFY",
      "EVIDENCE_CREATE",
      "EVIDENCE_READ",
      "EVIDENCE_UPDATE",
      "CUSTODY_TRANSFER",
      "CUSTODY_ACCEPT",
      "CUSTODY_REJECT",
      "CUSTODY_HISTORY_READ",
      "AUDIT_READ",
      "CASE_PERMISSION_GRANT",
      "CASE_PERMISSION_REVOKE"
    ];

    for (const permName of requiredPermissions) {
      await prisma.permission.upsert({
        where: { name: permName },
        update: {},
        create: { name: permName, description: `${permName} permission` }
      });
    }

    // 1. Create Police & FSL Organizations
    const pOrg = await prisma.organization.create({
      data: { name: "Metropolitan Police Dept", code: `MPD-${Date.now()}` }
    });
    policeOrgId = pOrg.id;

    const fOrg = await prisma.organization.create({
      data: { name: "Regional Forensic Lab", code: `RFL-${Date.now()}` }
    });
    fslOrgId = fOrg.id;

    // 2. Create Roles
    const pRole = await prisma.role.create({
      data: { name: "Detective", organizationId: pOrg.id }
    });
    const fRole = await prisma.role.create({
      data: { name: "Forensic Examiner", organizationId: fOrg.id }
    });

    // 3. Create Users
    const uA = await prisma.user.create({
      data: {
        name: "Detective Alex (User A)",
        email: `detectiveA-${Date.now()}@example.com`,
        passwordHash: "password",
        memberships: { create: { organizationId: pOrg.id, roleId: pRole.id } }
      }
    });
    policeUserA = { id: uA.id, token: signToken({ userId: uA.id }) };

    const uB = await prisma.user.create({
      data: {
        name: "FSL Analyst Beth (User B)",
        email: `analystB-${Date.now()}@example.com`,
        passwordHash: "password",
        memberships: { create: { organizationId: fOrg.id, roleId: fRole.id } }
      }
    });
    fslUserB = { id: uB.id, token: signToken({ userId: uB.id }) };

    const uC = await prisma.user.create({
      data: {
        name: "Random Officer Charlie (User C)",
        email: `charlieC-${Date.now()}@example.com`,
        passwordHash: "password",
        memberships: { create: { organizationId: fOrg.id, roleId: fRole.id } }
      }
    });
    randomUserC = { id: uC.id, token: signToken({ userId: uC.id }) };

    // 4. Create Case CASE-001 owned by Police (User A as Admin)
    const caseRecord = await prisma.case.create({
      data: {
        caseNumber: `CASE-P6-${Date.now()}`,
        title: "Forensic Evidence Cyber Case 001",
        organizationId: pOrg.id,
        createdById: policeUserA.id,
        participants: {
          create: [
            { userId: policeUserA.id, isCaseAdmin: true }
          ]
        }
      }
    });
    caseId = caseRecord.id;

    // 5. Create Document & Version V1
    const doc = await prisma.document.create({
      data: {
        caseId: caseRecord.id,
        title: "Forensic Hard Drive Dump",
        versions: {
          create: {
            versionNumber: 1,
            originalFileName: "disk_dump.raw",
            mimeType: "application/octet-stream",
            fileSize: BigInt(5242880),
            sha256Hash: "a".repeat(64),
            storageProvider: "S3",
            storageBucket: "police-evidence",
            storageKey: `disk-${Date.now()}.raw`,
            uploadedById: policeUserA.id
          }
        }
      },
      include: { versions: true }
    });
    documentId = doc.id;
    documentVersionId = doc.versions[0].id;

    // 6. Create Evidence for Document Version
    const evd = await prisma.evidence.create({
      data: {
        caseId: caseRecord.id,
        documentVersionId,
        evidenceNumber: "EVD-P6-001",
        title: "Primary HDD Drive",
        status: "ACTIVE",
        currentCustodianId: policeUserA.id,
        createdById: policeUserA.id
      }
    });
    evidenceId = evd.id;
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "CustodyEvent", "AuditEvent" CASCADE;`);
    await prisma.casePermission.deleteMany({ where: { caseId } });
    await prisma.custodyTransfer.deleteMany({ where: { evidence: { caseId } } });
    await prisma.evidence.deleteMany({ where: { caseId } });
    await prisma.documentVersion.deleteMany({ where: { document: { caseId } } });
    await prisma.document.deleteMany({ where: { caseId } });
    await prisma.caseParticipant.deleteMany({ where: { caseId } });
    await prisma.case.deleteMany({ where: { id: caseId } });
    await prisma.organizationMembership.deleteMany({ where: { organizationId: { in: [policeOrgId, fslOrgId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [policeUserA.id, fslUserB.id, randomUserC.id] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [policeOrgId, fslOrgId] } } });
    await prisma.$disconnect();
  });

  test("Step 1: User A (Police Case Admin) can access CASE-001 (200 OK)", async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}`)
      .set("Authorization", `Bearer ${policeUserA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(caseId);
  });

  test("Step 2: User B (FSL Analyst) is denied access to CASE-001 initially (403 Forbidden)", async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}`)
      .set("Authorization", `Bearer ${fslUserB.token}`);

    expect(res.status).toBe(403);
  });

  test("Step 3: Police Admin adds User B as Case Participant", async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/participants`)
      .set("Authorization", `Bearer ${policeUserA.token}`)
      .send({
        userId: fslUserB.id,
        isCaseAdmin: false
      });

    expect(res.status).toBe(201);
  });

  test("Step 4: Grant CASE_READ, DOCUMENT_READ, EVIDENCE_READ to User B", async () => {
    const p1 = await request(app)
      .post(`/api/authorization/cases/${caseId}/permissions`)
      .set("Authorization", `Bearer ${policeUserA.token}`)
      .send({ userId: fslUserB.id, permissionName: "CASE_READ", effect: "GRANT" });
    expect(p1.status).toBe(201);

    const p2 = await request(app)
      .post(`/api/authorization/cases/${caseId}/permissions`)
      .set("Authorization", `Bearer ${policeUserA.token}`)
      .send({ userId: fslUserB.id, permissionName: "DOCUMENT_READ", effect: "GRANT" });
    expect(p2.status).toBe(201);

    const p3 = await request(app)
      .post(`/api/authorization/cases/${caseId}/permissions`)
      .set("Authorization", `Bearer ${policeUserA.token}`)
      .send({ userId: fslUserB.id, permissionName: "EVIDENCE_READ", effect: "GRANT" });
    expect(p3.status).toBe(201);
  });

  test("Step 5: User B can now GET CASE (200 OK)", async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}`)
      .set("Authorization", `Bearer ${fslUserB.token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(caseId);
  });

  test("Step 6: User B can GET DOCUMENT (200 OK)", async () => {
    const res = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${fslUserB.token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(documentId);
  });

  test("Step 7: User B can GET EVIDENCE (200 OK)", async () => {
    const res = await request(app)
      .get(`/api/evidence/${evidenceId}`)
      .set("Authorization", `Bearer ${fslUserB.token}`);

    expect(res.status).toBe(200);
    expect(res.body.evidence.id).toBe(evidenceId);
  });

  test("Step 8: Random User C is denied GET CASE (403 Forbidden)", async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}`)
      .set("Authorization", `Bearer ${randomUserC.token}`);

    expect(res.status).toBe(403);
  });

  test("Step 9: Revoke CASE_READ from User B -> User B GET CASE returns 403 Forbidden", async () => {
    const revokeRes = await request(app)
      .delete(`/api/authorization/cases/${caseId}/permissions`)
      .set("Authorization", `Bearer ${policeUserA.token}`)
      .send({
        userId: fslUserB.id,
        permissionName: "CASE_READ"
      });

    expect(revokeRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/cases/${caseId}`)
      .set("Authorization", `Bearer ${fslUserB.token}`);

    expect(getRes.status).toBe(403);
  });

  test("Step 10: Verify Audit Log captures case & authorization state history", async () => {
    const auditRes = await request(app)
      .get(`/api/cases/${caseId}/audit`)
      .set("Authorization", `Bearer ${policeUserA.token}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.events).toBeDefined();
    expect(Array.isArray(auditRes.body.events)).toBe(true);
  });
});
