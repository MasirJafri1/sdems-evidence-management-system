import { prisma } from "../../lib/prisma";
import { createAuditEvent } from "../audit/audit.service";
import { calculateSha256 } from "../../utils/hash";

export interface CreateEvidenceInput {
  caseId: string;
  documentVersionId?: string;
  evidenceNumber: string;
  title: string;
  description?: string;
  createdById: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createEvidence(input: CreateEvidenceInput) {
  const participant = await prisma.caseParticipant.findUnique({
    where: {
      caseId_userId: {
        caseId: input.caseId,
        userId: input.createdById
      }
    }
  });

  if (!participant || participant.status !== "ACTIVE") {
    throw new Error("User is not an active participant of this case");
  }

  let targetVersionId = input.documentVersionId;

  if (!targetVersionId) {
    const doc = await prisma.document.create({
      data: {
        caseId: input.caseId,
        title: input.title,
        description: input.description ?? "Physical Property Item Log",
        documentType: "PHYSICAL_EXHIBIT",
        currentVersionNumber: 1
      }
    });

    const dummyHash = calculateSha256(Buffer.from(`${input.evidenceNumber}-${Date.now()}`));

    const ver = await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        versionNumber: 1,
        originalFileName: `${input.evidenceNumber}_log.txt`,
        mimeType: "text/plain",
        fileSize: BigInt(64),
        sha256Hash: dummyHash,
        storageProvider: "s3",
        storageBucket: "secure-evidence-bucket",
        storageKey: `cases/${input.caseId}/evidence/${input.evidenceNumber}/v1/log.txt`,
        uploadedById: input.createdById
      }
    });

    targetVersionId = ver.id;
  } else {
    const version = await prisma.documentVersion.findUnique({
      where: {
        id: targetVersionId
      },
      include: {
        document: true,
        evidence: true
      }
    });

    if (!version) {
      throw new Error("Document version not found");
    }

    if (version.document.caseId !== input.caseId) {
      throw new Error("Document version does not belong to this case");
    }

    if (version.evidence) {
      throw new Error("This document version is already registered as evidence");
    }
  }

  const evidence = await prisma.evidence.create({
    data: {
      caseId: input.caseId,
      documentVersionId: targetVersionId,
      evidenceNumber: input.evidenceNumber,
      title: input.title,
      description: input.description,
      currentCustodianId: input.createdById,
      createdById: input.createdById
    },
    include: {
      documentVersion: true,
      currentCustodian: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  await createAuditEvent({
    caseId: input.caseId,
    actorId: input.createdById,
    eventType: "EVIDENCE_CREATED",
    entityType: "Evidence",
    entityId: evidence.id,
    metadata: {
      evidenceNumber: evidence.evidenceNumber,
      documentVersionId: evidence.documentVersionId,
      currentCustodianId: evidence.currentCustodianId
    },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return evidence;
}
