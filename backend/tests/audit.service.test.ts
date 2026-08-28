import { prisma } from "../src/lib/prisma";
import {
  createAuditEvent,
  getCaseAuditHistory,
  verifyCaseAuditChain
} from "../src/modules/audit/audit.service";

describe("Audit service", () => {
  let caseId: string;
  let userId: string;

  beforeAll(async () => {
    const organization = await prisma.organization.create({
      data: {
        name: "Audit Test Organization",
        code: `AUDIT-${Date.now()}`
      }
    });

    const role = await prisma.role.create({
      data: {
        name: "Audit Tester",
        organizationId: organization.id
      }
    });

    const user = await prisma.user.create({
      data: {
        name: "Audit Tester",
        email: `audit-${Date.now()}@example.com`,
        passwordHash: "test-password",
        memberships: {
          create: {
            organizationId: organization.id,
            roleId: role.id
          }
        }
      }
    });

    userId = user.id;

    const caseRecord = await prisma.case.create({
      data: {
        caseNumber: `AUDIT-${Date.now()}`,
        title: "Audit Test Case",
        organizationId: organization.id,
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
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "AuditEvent" CASCADE;`);
    await prisma.case.deleteMany({
      where: { id: caseId }
    });
    await prisma.user.deleteMany({
      where: { id: userId }
    });
    await prisma.$disconnect();
  });

  test("creates first audit event", async () => {
    const event = await createAuditEvent({
      caseId,
      actorId: userId,
      eventType: "CASE_CREATED",
      entityType: "Case",
      entityId: caseId
    });

    expect(event.sequence).toBe(1);
    expect(event.previousHash).toBeNull();
    expect(event.eventHash).toHaveLength(64);
  });

  test("creates second event linked to first", async () => {
    const event = await createAuditEvent({
      caseId,
      actorId: userId,
      eventType: "DOCUMENT_CREATED",
      entityType: "Document",
      entityId: "document-1"
    });

    expect(event.sequence).toBe(2);
    expect(event.previousHash).not.toBeNull();
  });

  test("returns chronological history", async () => {
    const events = await getCaseAuditHistory(caseId);

    expect(events.length).toBeGreaterThanOrEqual(2);

    for (let i = 1; i < events.length; i++) {
      expect(events[i].sequence).toBe(events[i - 1].sequence + 1);
    }
  });

  test("audit chain verifies", async () => {
    const result = await verifyCaseAuditChain(caseId);

    expect(result.valid).toBe(true);
    expect(result.failures).toHaveLength(0);
  });
});
