import { prisma } from "../src/lib/prisma";
import { createEvidence } from "../src/modules/evidence/evidence.service";

describe("Evidence service", () => {
  let organizationId: string;
  let userId: string;
  let caseId: string;
  let documentId: string;
  let documentVersionId: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: {
        name: "Evidence Test Org",
        code: `EVD-ORG-${Date.now()}`
      }
    });
    organizationId = org.id;

    const role = await prisma.role.create({
      data: {
        name: "Evidence Tester",
        organizationId: org.id
      }
    });

    const user = await prisma.user.create({
      data: {
        name: "Evidence Officer",
        email: `evd-officer-${Date.now()}@example.com`,
        passwordHash: "test-hash",
        memberships: {
          create: {
            organizationId: org.id,
            roleId: role.id
          }
        }
      }
    });
    userId = user.id;

    const caseRecord = await prisma.case.create({
      data: {
        caseNumber: `CASE-EVD-${Date.now()}`,
        title: "Evidence Test Case",
        organizationId: org.id,
        createdById: user.id,
        participants: {
          create: {
            userId: user.id,
            isCaseAdmin: true
          }
        }
      }
    });
    caseId = caseRecord.id;

    const doc = await prisma.document.create({
      data: {
        caseId: caseRecord.id,
        title: "CCTV Footages",
        versions: {
          create: {
            versionNumber: 1,
            originalFileName: "cctv.mp4",
            mimeType: "video/mp4",
            fileSize: BigInt(1024),
            sha256Hash: "a".repeat(64),
            storageProvider: "S3",
            storageBucket: "test-bucket",
            storageKey: `key-${Date.now()}`,
            uploadedById: user.id
          }
        }
      },
      include: {
        versions: true
      }
    });
    documentId = doc.id;
    documentVersionId = doc.versions[0].id;
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "CustodyEvent", "AuditEvent" CASCADE;`);
    await prisma.custodyTransfer.deleteMany({ where: { evidence: { caseId } } });
    await prisma.evidence.deleteMany({ where: { caseId } });
    await prisma.documentVersion.deleteMany({ where: { documentId } });
    await prisma.document.deleteMany({ where: { id: documentId } });
    await prisma.case.deleteMany({ where: { id: caseId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  test("registers document version as active evidence", async () => {
    const evidence = await createEvidence({
      caseId,
      documentVersionId,
      evidenceNumber: "EVD-001",
      title: "Hard Drive CCTV Footage",
      createdById: userId
    });

    expect(evidence.id).toBeDefined();
    expect(evidence.evidenceNumber).toBe("EVD-001");
    expect(evidence.status).toBe("ACTIVE");
    expect(evidence.currentCustodianId).toBe(userId);
  });

  test("prevents registering same document version twice", async () => {
    await expect(
      createEvidence({
        caseId,
        documentVersionId,
        evidenceNumber: "EVD-002",
        title: "Duplicate Attempt",
        createdById: userId
      })
    ).rejects.toThrow("This document version is already registered as evidence");
  });
});
