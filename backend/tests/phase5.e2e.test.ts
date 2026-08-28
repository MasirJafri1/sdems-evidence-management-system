import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";
import { signToken } from "../src/utils/jwt";
import { createCustodyEventHash } from "../src/modules/evidence/custody.utils";
import { verifyCustodyHistory } from "../src/modules/evidence/custody.service";

describe("Phase 5 Milestone — Complete End-to-End Chain of Custody Lifecycle", () => {
  let organizationId: string;
  let userA: { id: string; token: string };
  let userB: { id: string; token: string };
  let userC: { id: string; token: string };
  let userD: { id: string; token: string };

  let caseId: string;
  let documentId: string;
  let documentVersionId: string;
  let evidenceId: string;

  beforeAll(async () => {
    // 1. Create Organization & Role
    const org = await prisma.organization.create({
      data: {
        name: "Forensic Evidence Unit",
        code: `FEU-${Date.now()}`
      }
    });
    organizationId = org.id;

    const role = await prisma.role.create({
      data: {
        name: "Forensic Investigator",
        organizationId: org.id
      }
    });

    // 2. Create 4 Users (A, B, C, D)
    const uA = await prisma.user.create({
      data: {
        name: "Investigator A",
        email: `investigatorA-${Date.now()}@example.com`,
        passwordHash: "password",
        memberships: { create: { organizationId: org.id, roleId: role.id } }
      }
    });
    userA = { id: uA.id, token: signToken({ userId: uA.id }) };

    const uB = await prisma.user.create({
      data: {
        name: "Evidence Officer B",
        email: `officerB-${Date.now()}@example.com`,
        passwordHash: "password",
        memberships: { create: { organizationId: org.id, roleId: role.id } }
      }
    });
    userB = { id: uB.id, token: signToken({ userId: uB.id }) };

    const uC = await prisma.user.create({
      data: {
        name: "FSL Analyst C",
        email: `analystC-${Date.now()}@example.com`,
        passwordHash: "password",
        memberships: { create: { organizationId: org.id, roleId: role.id } }
      }
    });
    userC = { id: uC.id, token: signToken({ userId: uC.id }) };

    const uD = await prisma.user.create({
      data: {
        name: "Court Custodian D",
        email: `custodianD-${Date.now()}@example.com`,
        passwordHash: "password",
        memberships: { create: { organizationId: org.id, roleId: role.id } }
      }
    });
    userD = { id: uD.id, token: signToken({ userId: uD.id }) };

    // 3. Create Case & Register Participants A, B, C, D
    const caseRecord = await prisma.case.create({
      data: {
        caseNumber: `CASE-FEU-${Date.now()}`,
        title: "Incident 404 Investigation",
        organizationId: org.id,
        createdById: userA.id,
        participants: {
          create: [
            { userId: userA.id, isCaseAdmin: true },
            { userId: userB.id, isCaseAdmin: false },
            { userId: userC.id, isCaseAdmin: false },
            { userId: userD.id, isCaseAdmin: false }
          ]
        }
      }
    });
    caseId = caseRecord.id;

    // 4. Create Document & Version V1
    const doc = await prisma.document.create({
      data: {
        caseId: caseRecord.id,
        title: "Station CCTV Recording",
        versions: {
          create: {
            versionNumber: 1,
            originalFileName: "cctv_main.mp4",
            mimeType: "video/mp4",
            fileSize: BigInt(1048576),
            sha256Hash: "e".repeat(64),
            storageProvider: "S3",
            storageBucket: "secure-evidence",
            storageKey: `cctv-${Date.now()}.mp4`,
            uploadedById: userA.id
          }
        }
      },
      include: { versions: true }
    });
    documentId = doc.id;
    documentVersionId = doc.versions[0].id;
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "CustodyEvent", "AuditEvent" CASCADE;`);
    await prisma.custodyTransfer.deleteMany({ where: { evidence: { caseId } } });
    await prisma.evidence.deleteMany({ where: { caseId } });
    await prisma.documentVersion.deleteMany({ where: { document: { caseId } } });
    await prisma.document.deleteMany({ where: { caseId } });
    await prisma.case.deleteMany({ where: { id: caseId } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id, userC.id, userD.id] } } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  test("Step 1: Register Document V1 as Evidence (Initial Custodian = User A)", async () => {
    const res = await request(app)
      .post("/api/evidence")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        caseId,
        documentVersionId,
        evidenceNumber: "EVD-CCTV-001",
        title: "Primary Location CCTV",
        description: "CCTV footage from main hall camera"
      });

    expect(res.status).toBe(201);
    expect(res.body.evidence.status).toBe("ACTIVE");
    expect(res.body.evidence.currentCustodianId).toBe(userA.id);
    evidenceId = res.body.evidence.id;
  });

  test("Step 2: Transfer 1 — User A transfers to User B (B Accepts -> CustodyEvent #1)", async () => {
    // Initiate Transfer A -> B
    const transferRes = await request(app)
      .post(`/api/evidence/${evidenceId}/transfers`)
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        toUserId: userB.id,
        reason: "Transferred to central evidence room"
      });

    expect(transferRes.status).toBe(201);
    expect(transferRes.body.transfer.status).toBe("PENDING");
    const t1Id = transferRes.body.transfer.id;

    // Custodian remains A prior to acceptance
    const midEvd = await prisma.evidence.findUnique({ where: { id: evidenceId } });
    expect(midEvd?.status).toBe("IN_TRANSFER");
    expect(midEvd?.currentCustodianId).toBe(userA.id);

    // User B Accepts
    const acceptRes = await request(app)
      .post(`/api/transfers/${t1Id}/accept`)
      .set("Authorization", `Bearer ${userB.token}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.transfer.status).toBe("ACCEPTED");
    expect(acceptRes.body.evidence.currentCustodianId).toBe(userB.id);
    expect(acceptRes.body.evidence.status).toBe("ACTIVE");
    expect(acceptRes.body.custodyEvent.sequence).toBe(1);
    expect(acceptRes.body.custodyEvent.eventHash).toHaveLength(64);
  });

  test("Step 3: Transfer 2 — User B transfers to User C (C Accepts -> CustodyEvent #2 linked to #1)", async () => {
    // Initiate Transfer B -> C
    const transferRes = await request(app)
      .post(`/api/evidence/${evidenceId}/transfers`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({
        toUserId: userC.id,
        reason: "Dispatched to FSL for video enhancement"
      });

    expect(transferRes.status).toBe(201);
    const t2Id = transferRes.body.transfer.id;

    // User C Accepts
    const acceptRes = await request(app)
      .post(`/api/transfers/${t2Id}/accept`)
      .set("Authorization", `Bearer ${userC.token}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.evidence.currentCustodianId).toBe(userC.id);
    expect(acceptRes.body.custodyEvent.sequence).toBe(2);
  });

  test("Step 4: Transfer 3 — User C transfers to User D (D Accepts -> CustodyEvent #3 linked to #2)", async () => {
    // Initiate Transfer C -> D
    const transferRes = await request(app)
      .post(`/api/evidence/${evidenceId}/transfers`)
      .set("Authorization", `Bearer ${userC.token}`)
      .send({
        toUserId: userD.id,
        reason: "Deposited into Court Evidence Vault"
      });

    expect(transferRes.status).toBe(201);
    const t3Id = transferRes.body.transfer.id;

    // User D Accepts
    const acceptRes = await request(app)
      .post(`/api/transfers/${t3Id}/accept`)
      .set("Authorization", `Bearer ${userD.token}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.evidence.currentCustodianId).toBe(userD.id);
    expect(acceptRes.body.custodyEvent.sequence).toBe(3);
  });

  test("Step 5: Verify Complete Chain of Custody History & Cryptographic Linkage", async () => {
    // API endpoint check
    const historyRes = await request(app)
      .get(`/api/evidence/${evidenceId}/custody-history`)
      .set("Authorization", `Bearer ${userA.token}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.totalEvents).toBe(3);
    expect(historyRes.body.history[0].fromUser.id).toBe(userA.id);
    expect(historyRes.body.history[0].toUser.id).toBe(userB.id);
    expect(historyRes.body.history[1].fromUser.id).toBe(userB.id);
    expect(historyRes.body.history[1].toUser.id).toBe(userC.id);
    expect(historyRes.body.history[2].fromUser.id).toBe(userC.id);
    expect(historyRes.body.history[2].toUser.id).toBe(userD.id);

    // API Verification endpoint check
    const verifyRes = await request(app)
      .get(`/api/evidence/${evidenceId}/custody-history/verify`)
      .set("Authorization", `Bearer ${userA.token}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.valid).toBe(true);
    expect(verifyRes.body.failures).toHaveLength(0);

    // Direct service verification function check
    const internalVerify = await verifyCustodyHistory(evidenceId);
    expect(internalVerify.valid).toBe(true);
  });

  test("Step 6: Rejection Path — User D attempts transfer to User B, B Rejects", async () => {
    // Initiate Transfer D -> B
    const transferRes = await request(app)
      .post(`/api/evidence/${evidenceId}/transfers`)
      .set("Authorization", `Bearer ${userD.token}`)
      .send({
        toUserId: userB.id,
        reason: "Return to evidence room"
      });

    expect(transferRes.status).toBe(201);
    const tRejId = transferRes.body.transfer.id;

    // User B Rejects
    const rejectRes = await request(app)
      .post(`/api/transfers/${tRejId}/reject`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({
        rejectionReason: "Receiving vault undergoing maintenance"
      });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.transfer.status).toBe("REJECTED");

    // Verify Evidence status returned to ACTIVE with Custodian remaining User D
    const evdPostReject = await prisma.evidence.findUnique({ where: { id: evidenceId } });
    expect(evdPostReject?.status).toBe("ACTIVE");
    expect(evdPostReject?.currentCustodianId).toBe(userD.id);

    // Verify CustodyEvents count remains 3 (no new CustodyEvent created for rejection)
    const historyPostReject = await prisma.custodyEvent.findMany({ where: { evidenceId } });
    expect(historyPostReject.length).toBe(3);

    // Verify Audit Log captured CUSTODY_TRANSFER_REJECTED event
    const auditRes = await request(app)
      .get(`/api/cases/${caseId}/audit`)
      .set("Authorization", `Bearer ${userA.token}`);

    expect(auditRes.status).toBe(200);
    const rejectedAuditEvent = auditRes.body.events.find(
      (e: any) => e.eventType === "CUSTODY_TRANSFER_REJECTED"
    );
    expect(rejectedAuditEvent).toBeDefined();
    expect(rejectedAuditEvent.metadata.rejectionReason).toBe("Receiving vault undergoing maintenance");
  });
});
