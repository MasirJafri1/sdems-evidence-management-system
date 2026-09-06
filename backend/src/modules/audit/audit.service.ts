import { Prisma, AuditEventType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { createAuditHash, verifyAuditEventHash } from "./audit.utils";

export interface CreateAuditEventInput {
  caseId: string;
  actorId?: string | null;
  eventType: AuditEventType;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAuditEvent(input: CreateAuditEventInput) {
  /*
   * Serializable transaction prevents two simultaneous
   * requests from creating the same sequence number.
   */
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const lastEvent = await tx.auditEvent.findFirst({
            where: {
              caseId: input.caseId
            },
            orderBy: {
              sequence: "desc"
            }
          });

          const sequence = lastEvent ? lastEvent.sequence + 1 : 1;
          const previousHash = lastEvent ? lastEvent.eventHash : null;
          const createdAt = new Date();
          const metadata = input.metadata ?? null;

          const eventHash = createAuditHash({
            caseId: input.caseId,
            actorId: input.actorId ?? null,
            eventType: input.eventType,
            entityType: input.entityType ?? null,
            entityId: input.entityId ?? null,
            metadata,
            sequence,
            previousHash,
            createdAt
          });

          return await tx.auditEvent.create({
            data: {
              caseId: input.caseId,
              actorId: input.actorId ?? null,
              eventType: input.eventType,
              entityType: input.entityType ?? null,
              entityId: input.entityId ?? null,
              metadata: metadata as Prisma.InputJsonValue | undefined,
              ipAddress: input.ipAddress ?? null,
              userAgent: input.userAgent ?? null,
              sequence,
              previousHash,
              eventHash,
              createdAt
            }
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );
    } catch (error) {
      if (attempt === 3) {
        throw error;
      }
    }
  }

  throw new Error("Unable to create audit event");
}

export async function getCaseAuditHistory(caseId: string) {
  return prisma.auditEvent.findMany({
    where: {
      caseId
    },
    orderBy: {
      sequence: "asc"
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

export async function verifyCaseAuditChain(caseId: string) {
  const events = await prisma.auditEvent.findMany({
    where: {
      caseId
    },
    orderBy: {
      sequence: "asc"
    }
  });

  let expectedPreviousHash: string | null = null;

  const failures: Array<{
    sequence: number;
    reason: string;
  }> = [];

  for (let index = 0; index < events.length; index++) {
    const event = events[index];

    /*
     * Sequence must be continuous.
     */
    const expectedSequence = index + 1;

    if (event.sequence !== expectedSequence) {
      failures.push({
        sequence: event.sequence,
        reason: `Expected sequence ${expectedSequence}`
      });
    }

    /*
     * Previous hash must match.
     */
    if (event.previousHash !== expectedPreviousHash) {
      failures.push({
        sequence: event.sequence,
        reason: "Previous hash mismatch"
      });
    }

    /*
     * Recalculate this event's hash.
     */
    const validHash = verifyAuditEventHash({
      caseId: event.caseId,
      actorId: event.actorId,
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata,
      sequence: event.sequence,
      previousHash: event.previousHash,
      eventHash: event.eventHash,
      createdAt: event.createdAt
    });

    if (!validHash) {
      failures.push({
        sequence: event.sequence,
        reason: "Event hash mismatch"
      });
    }

    expectedPreviousHash = event.eventHash;
  }

  return {
    valid: failures.length === 0,
    totalEvents: events.length,
    failures
  };
}

export async function getOrganizationAuditHistory(organizationId?: string) {
  return prisma.auditEvent.findMany({
    where: organizationId
      ? { case: { organizationId } }
      : undefined,
    orderBy: {
      createdAt: "desc"
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      case: {
        select: {
          id: true,
          caseNumber: true,
          title: true
        }
      }
    }
  });
}
