import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import {
  verifyDocumentVersion,
  getBlockchainAnchor,
  getBlockchainStatus
} from "./blockchain.service";
import { createAuditEvent } from "../audit/audit.service";

export async function verifyVersion(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const versionId = req.params.versionId as string;

  const version = await prisma.documentVersion.findUnique({
    where: {
      id: versionId
    },
    include: {
      document: true
    }
  });

  if (!version) {
    res.status(404).json({
      message: "Document version not found"
    });
    return;
  }

  const participant = await prisma.caseParticipant.findUnique({
    where: {
      caseId_userId: {
        caseId: version.document.caseId,
        userId
      }
    }
  });

  if (!participant || participant.status !== "ACTIVE") {
    res.status(403).json({
      message: "You are not authorized to verify this document"
    });
    return;
  }

  const result = await verifyDocumentVersion(versionId);

  await createAuditEvent({
    caseId: version.document.caseId,
    actorId: userId,
    eventType: "DOCUMENT_VERIFIED",
    entityType: "DocumentVersion",
    entityId: version.id,
    metadata: {
      versionNumber: version.versionNumber,
      sha256Hash: version.sha256Hash,
      verificationResult: result.verified
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? null
  });

  res.json(result);
}

export async function getVersionAnchor(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const versionId = req.params.versionId as string;

  const version = await prisma.documentVersion.findUnique({
    where: {
      id: versionId
    },
    include: {
      document: true
    }
  });

  if (!version) {
    res.status(404).json({
      message: "Document version not found"
    });
    return;
  }

  const participant = await prisma.caseParticipant.findUnique({
    where: {
      caseId_userId: {
        caseId: version.document.caseId,
        userId
      }
    }
  });

  if (!participant || participant.status !== "ACTIVE") {
    res.status(403).json({
      message: "You are not authorized to view this anchor"
    });
    return;
  }

  const anchor = await getBlockchainAnchor(versionId);

  if (!anchor) {
    res.status(404).json({
      message: "Blockchain anchor not found"
    });
    return;
  }

  res.json(anchor);
}

export async function blockchainHealth(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const status = await getBlockchainStatus();
    res.json(status);
  } catch (error) {
    res.status(503).json({
      connected: false,
      message: error instanceof Error ? error.message : "Blockchain unavailable"
    });
  }
}
