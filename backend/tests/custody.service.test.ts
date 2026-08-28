import { prisma } from "../src/lib/prisma";
import { createEvidence } from "../src/modules/evidence/evidence.service";
import {
  createCustodyTransfer,
  acceptCustodyTransfer,
  rejectCustodyTransfer,
  getCustodyHistory
} from "../src/modules/evidence/custody.service";

describe("Custody transfer & history service", () => {
  let organizationId: string;
  let userAId: string;
  let userBId: string;
  let caseId: string;
  let documentVersion1Id: string;
  let documentVersion2Id: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: {
        name: "Custody Service Test Org",
        code: `CUST-ORG-${Date.now()}`
      }
    });
    organizationId = org.id;

    const role = await prisma.role.create({
      data: {
        name: "Custody Officer",
        organizationId: org.id
      }
    });

    const userA = await prisma.user.create({
      data: {
        name: "User A (Custodian)",
        email: `usera-${Date.now()}@example.com`,
        passwordHash: "test-hash",
        memberships: { create: { organizationId: org.id, roleId: role.id } }
      }
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        name: "User B (Recipient)",
        email: `userb-${Date.now()}@example.com`,
        passwordHash: "test-hash",
        memberships: { create: { organizationId: org.id, roleId: role.id } }
      }
    });
    userBId = userB.id;

    const caseRecord = await prisma.case.create({
      data: {
        caseNumber: `CASE-CUST-${Date.now()}`,
        title: "Custody Chain Case",
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
        title: "Physical Forensic Evidence",
        versions: {
          create: [
            {
              versionNumber: 1,
              originalFileName: "v1.bin",
              mimeType: "application/octet-stream",
              fileSize: BigInt(2048),
              sha256Hash: "b".repeat(64),
              storageProvider: "S3",
              storageBucket: "test-bucket",
              storageKey: `key1-${Date.now()}`,
              uploadedById: userA.id
            },
            {
              versionNumber: 2,
              originalFileName: "v2.bin",
              mimeType: "application/octet-stream",
              fileSize: BigInt(4096),
              sha256Hash: "c".repeat(64),
              storageProvider: "S3",
              storageBucket: "test-bucket",
              storageKey: `key2-${Date.now()}`,
              uploadedById: userA.id
            }
          ]
        }
      },
      include: {
        versions: true
      }
    });
    documentVersion1Id = doc.versions.find((v) => v.versionNumber === 1)!.id;
    documentVersion2Id = doc.versions.find((v) => v.versionNumber === 2)!.id;
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

  test("transfer initiation keeps current custodian until recipient accepts", async () => {
    const evidence = await createEvidence({
      caseId,
      documentVersionId: documentVersion1Id,
      evidenceNumber: "EVD-CUST-001",
      title: "Hard Drive A",
      createdById: userAId
    });

    const transfer = await createCustodyTransfer({
      evidenceId: evidence.id,
      fromUserId: userAId,
      toUserId: userBId,
      reason: "Handing over for lab extraction",
      initiatedById: userAId
    });

    expect(transfer.status).toBe("PENDING");

    const updatedEvidence = await prisma.evidence.findUnique({
      where: { id: evidence.id }
    });
    expect(updatedEvidence?.status).toBe("IN_TRANSFER");
    expect(updatedEvidence?.currentCustodianId).toBe(userAId);
  });

  test("rejecting custody transfer returns evidence to ACTIVE and keeps original custodian", async () => {
    const evidence = await prisma.evidence.findFirst({
      where: { evidenceNumber: "EVD-CUST-001" }
    });
    const pendingTransfer = await prisma.custodyTransfer.findFirst({
      where: { evidenceId: evidence!.id, status: "PENDING" }
    });

    const rejected = await rejectCustodyTransfer(
      pendingTransfer!.id,
      userBId,
      "Package seal was damaged"
    );

    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejectionReason).toBe("Package seal was damaged");

    const updatedEvidence = await prisma.evidence.findUnique({
      where: { id: evidence!.id }
    });
    expect(updatedEvidence?.status).toBe("ACTIVE");
    expect(updatedEvidence?.currentCustodianId).toBe(userAId);

    const history = await getCustodyHistory(evidence!.id);
    expect(history.length).toBe(0);
  });

  test("accepting custody transfer updates custodian, sets ACTIVE status, and creates CustodyEvent", async () => {
    const evidence = await prisma.evidence.findFirst({
      where: { evidenceNumber: "EVD-CUST-001" }
    });

    const newTransfer = await createCustodyTransfer({
      evidenceId: evidence!.id,
      fromUserId: userAId,
      toUserId: userBId,
      reason: "Handover re-attempted with intact seal",
      initiatedById: userAId
    });

    const result = await acceptCustodyTransfer(newTransfer.id, userBId);

    expect(result.updatedTransfer.status).toBe("ACCEPTED");
    expect(result.updatedEvidence.currentCustodianId).toBe(userBId);
    expect(result.updatedEvidence.status).toBe("ACTIVE");
    expect(result.custodyEvent.sequence).toBe(1);
    expect(result.custodyEvent.eventHash).toHaveLength(64);

    const history = await getCustodyHistory(evidence!.id);
    expect(history.length).toBe(1);
    expect(history[0].fromUserId).toBe(userAId);
    expect(history[0].toUserId).toBe(userBId);
  });
});
