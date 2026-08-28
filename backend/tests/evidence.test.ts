import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";
import { signToken } from "../src/utils/jwt";

describe("Evidence & Custody API Integration Tests", () => {
  let organizationId: string;
  let userAId: string;
  let userBId: string;
  let userAToken: string;
  let userBToken: string;
  let caseId: string;
  let documentVersionId: string;
  let evidenceId: string;
  let transferId: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: {
        name: "Evidence API Org",
        code: `EVD-API-ORG-${Date.now()}`
      }
    });
    organizationId = org.id;

    const role = await prisma.role.create({
      data: {
        name: "API Tester",
        organizationId: org.id
      }
    });

    const userA = await prisma.user.create({
      data: {
        name: "Officer A",
        email: `officerA-${Date.now()}@example.com`,
        passwordHash: "test-hash",
        memberships: { create: { organizationId: org.id, roleId: role.id } }
      }
    });
    userAId = userA.id;
    userAToken = signToken({ userId: userA.id });

    const userB = await prisma.user.create({
      data: {
        name: "Officer B",
        email: `officerB-${Date.now()}@example.com`,
        passwordHash: "test-hash",
        memberships: { create: { organizationId: org.id, roleId: role.id } }
      }
    });
    userBId = userB.id;
    userBToken = signToken({ userId: userB.id });

    const caseRecord = await prisma.case.create({
      data: {
        caseNumber: `CASE-API-${Date.now()}`,
        title: "Evidence API Case",
        organizationId: org.id,
        createdById: userA.id,
        participants: {
          create: [
            { userId: userA.id, isCaseAdmin: true },
            { userId: userB.id, isCaseAdmin: false }
          ]
        }
      }
    });
    caseId = caseRecord.id;

    const doc = await prisma.document.create({
      data: {
        caseId: caseRecord.id,
        title: "Digital Audio Recording",
        versions: {
          create: {
            versionNumber: 1,
            originalFileName: "audio.wav",
            mimeType: "audio/wav",
            fileSize: BigInt(512),
            sha256Hash: "d".repeat(64),
            storageProvider: "S3",
            storageBucket: "test-bucket",
            storageKey: `key-audio-${Date.now()}`,
            uploadedById: userA.id
          }
        }
      },
      include: { versions: true }
    });
    documentVersionId = doc.versions[0].id;
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "CustodyEvent", "AuditEvent" CASCADE;`);
    await prisma.custodyTransfer.deleteMany({ where: { evidence: { caseId } } });
    await prisma.evidence.deleteMany({ where: { caseId } });
    await prisma.documentVersion.deleteMany({ where: { document: { caseId } } });
    await prisma.document.deleteMany({ where: { caseId } });
    await prisma.case.deleteMany({ where: { id: caseId } });
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  test("POST /api/evidence - creates evidence for document version", async () => {
    const res = await request(app)
      .post("/api/evidence")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        caseId,
        documentVersionId,
        evidenceNumber: "EVD-API-001",
        title: "Primary Audio Evidence",
        description: "Recorded interview"
      });

    expect(res.status).toBe(201);
    expect(res.body.evidence).toBeDefined();
    expect(res.body.evidence.evidenceNumber).toBe("EVD-API-001");
    evidenceId = res.body.evidence.id;
  });

  test("GET /api/evidence/:evidenceId - retrieves evidence details", async () => {
    const res = await request(app)
      .get(`/api/evidence/${evidenceId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.evidence.id).toBe(evidenceId);
    expect(res.body.evidence.currentCustodian.id).toBe(userAId);
  });

  test("POST /api/evidence/:evidenceId/transfers - initiates custody transfer", async () => {
    const res = await request(app)
      .post(`/api/evidence/${evidenceId}/transfers`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        toUserId: userBId,
        reason: "Sending to forensics lab"
      });

    expect(res.status).toBe(201);
    expect(res.body.transfer.status).toBe("PENDING");
    transferId = res.body.transfer.id;
  });

  test("POST /api/transfers/:transferId/accept - recipient accepts transfer", async () => {
    const res = await request(app)
      .post(`/api/transfers/${transferId}/accept`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transfer.status).toBe("ACCEPTED");
    expect(res.body.evidence.currentCustodianId).toBe(userBId);
    expect(res.body.custodyEvent).toBeDefined();
  });

  test("GET /api/evidence/:evidenceId/custody-history - retrieves chain of custody", async () => {
    const res = await request(app)
      .get(`/api/evidence/${evidenceId}/custody-history`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalEvents).toBe(1);
    expect(res.body.history[0].fromUser.id).toBe(userAId);
    expect(res.body.history[0].toUser.id).toBe(userBId);
  });
});
