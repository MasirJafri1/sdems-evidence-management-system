import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { createAuditEvent } from "../audit/audit.service";
import { createEvidence } from "./evidence.service";
import { checkCasePermission } from "../authorization/authorization.service";
import { isSuperAdmin } from "../authorization/authorization.context";
import {
  createCustodyTransfer,
  acceptCustodyTransfer,
  rejectCustodyTransfer,
  getCustodyHistory,
  verifyCustodyHistory,
  getTransfersForUser
} from "./custody.service";
import { indexEvidenceById } from "../search/document-indexer.service";

function serializeEvidence(evidence: any) {
  if (!evidence) return null;
  return {
    ...evidence,
    documentVersion: evidence.documentVersion
      ? {
        ...evidence.documentVersion,
        fileSize: evidence.documentVersion.fileSize?.toString()
      }
      : undefined
  };
}

/**
 * Centralized case access check for evidence endpoints.
 * Replaces inline caseParticipant.findUnique checks that
 * previously blocked Org Admins.
 */
async function verifyEvidenceCaseAccess(userId: string, caseId: string): Promise<boolean> {
  const result = await checkCasePermission({
    userId,
    caseId,
    permissionName: "EVIDENCE_READ"
  });
  return result.allowed;
}

export async function createEvidenceController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;

  const {
    caseId,
    documentVersionId,
    evidenceNumber,
    title,
    description
  } = req.body;

  if (
    !caseId ||
    !evidenceNumber ||
    !title
  ) {
    res.status(400).json({
      message:
        "caseId, evidenceNumber and title are required"
    });
    return;
  }

  try {
    const evidence = await createEvidence({
      caseId,
      documentVersionId,
      evidenceNumber,
      title,
      description,
      createdById: userId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined
    });

    // Auto-index in OpenSearch (awaited before response)
    await indexEvidenceById(evidence.id);

    res.status(201).json({
      evidence: serializeEvidence(evidence)
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create evidence";

    res.status(400).json({
      message
    });
  }
}

export async function getEvidence(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const evidenceId = req.params.evidenceId as string;

  const evidence = await prisma.evidence.findUnique({
    where: {
      id: evidenceId
    },
    include: {
      documentVersion: {
        include: {
          blockchainAnchor: true
        }
      },
      currentCustodian: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!evidence) {
    res.status(404).json({
      message: "Evidence not found"
    });
    return;
  }

  // Use centralized auth (handles SuperAdmin + OrgAdmin + CaseParticipant)
  if (!(await verifyEvidenceCaseAccess(userId, evidence.caseId))) {
    res.status(403).json({
      message: "You are not authorized to access this evidence"
    });
    return;
  }

  res.json({
    evidence: serializeEvidence(evidence)
  });
}

export async function createTransferController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const evidenceId = req.params.evidenceId as string;

  const { toUserId, reason } = req.body;

  if (!toUserId || !reason) {
    res.status(400).json({
      message: "toUserId and reason are required"
    });
    return;
  }

  try {
    const evidence = await prisma.evidence.findUnique({
      where: {
        id: evidenceId
      }
    });

    if (!evidence) {
      res.status(404).json({
        message: "Evidence not found"
      });
      return;
    }

    const transfer = await createCustodyTransfer({
      evidenceId,
      fromUserId: userId,
      toUserId,
      reason,
      initiatedById: userId
    });

    await createAuditEvent({
      caseId: evidence.caseId,
      actorId: userId,
      eventType: "CUSTODY_TRANSFER_INITIATED",
      entityType: "CustodyTransfer",
      entityId: transfer.id,
      metadata: {
        evidenceId,
        fromUserId: userId,
        toUserId,
        reason,
        status: "PENDING"
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined
    });

    res.status(201).json({
      transfer
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create custody transfer";

    res.status(400).json({
      message
    });
  }
}

export async function acceptTransferController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const transferId = req.params.transferId as string;

  try {
    const result = await acceptCustodyTransfer(transferId, userId);

    await createAuditEvent({
      caseId: result.updatedEvidence.caseId,
      actorId: userId,
      eventType: "CUSTODY_TRANSFER_ACCEPTED",
      entityType: "CustodyTransfer",
      entityId: transferId,
      metadata: {
        evidenceId: result.updatedEvidence.id,
        custodyEventId: result.custodyEvent.id,
        custodyEventHash: result.custodyEvent.eventHash,
        blockchainAnchorId: result.custodyEvent.blockchainAnchorId,
        blockchainTransactionHash: result.custodyEvent.blockchainTransactionHash
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined
    });

    const custodyEventSerialized = {
      ...result.custodyEvent,
      blockchainBlockNumber: result.custodyEvent.blockchainBlockNumber?.toString() ?? null
    };

    res.json({
      message: "Custody transfer accepted",
      transfer: result.updatedTransfer,
      evidence: serializeEvidence(result.updatedEvidence),
      custodyEvent: custodyEventSerialized
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to accept custody transfer";

    res.status(400).json({
      message
    });
  }
}

export async function rejectTransferController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const transferId = req.params.transferId as string;

  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    res.status(400).json({
      message: "rejectionReason is required"
    });
    return;
  }

  try {
    const transfer = await prisma.custodyTransfer.findUnique({
      where: {
        id: transferId
      },
      include: {
        evidence: true
      }
    });

    if (!transfer) {
      res.status(404).json({
        message: "Custody transfer not found"
      });
      return;
    }

    const result = await rejectCustodyTransfer(
      transferId,
      userId,
      rejectionReason
    );

    await createAuditEvent({
      caseId: transfer.evidence.caseId,
      actorId: userId,
      eventType: "CUSTODY_TRANSFER_REJECTED",
      entityType: "CustodyTransfer",
      entityId: transferId,
      metadata: {
        evidenceId: transfer.evidenceId,
        rejectionReason
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined
    });

    res.json({
      message: "Custody transfer rejected",
      transfer: result
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to reject custody transfer";

    res.status(400).json({
      message
    });
  }
}

export async function custodyHistory(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const evidenceId = req.params.evidenceId as string;

  const evidence = await prisma.evidence.findUnique({
    where: {
      id: evidenceId
    }
  });

  if (!evidence) {
    res.status(404).json({
      message: "Evidence not found"
    });
    return;
  }

  // Use centralized auth instead of inline participant check
  if (!(await verifyEvidenceCaseAccess(userId, evidence.caseId))) {
    res.status(403).json({
      message: "You are not authorized to view this evidence's custody history"
    });
    return;
  }

  const history = await getCustodyHistory(evidenceId);

  const historySerialized = history.map((event) => ({
    ...event,
    blockchainBlockNumber: event.blockchainBlockNumber?.toString() ?? null
  }));

  res.json({
    evidenceId,
    totalEvents: historySerialized.length,
    history: historySerialized
  });
}

export async function verifyCustodyHistoryController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const evidenceId = req.params.evidenceId as string;

  const evidence = await prisma.evidence.findUnique({
    where: {
      id: evidenceId
    }
  });

  if (!evidence) {
    res.status(404).json({
      message: "Evidence not found"
    });
    return;
  }

  // Use centralized auth instead of inline participant check
  if (!(await verifyEvidenceCaseAccess(userId, evidence.caseId))) {
    res.status(403).json({
      message: "You are not authorized to verify this evidence"
    });
    return;
  }

  const result = await verifyCustodyHistory(evidenceId);

  res.json({
    evidenceId,
    ...result
  });
}

export async function listCaseEvidenceController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const caseId = req.params.caseId as string;

  // Use centralized auth instead of inline participant check
  if (!(await verifyEvidenceCaseAccess(userId, caseId))) {
    res.status(403).json({
      message: "You are not authorized to view evidence for this case"
    });
    return;
  }

  const items = await prisma.evidence.findMany({
    where: {
      caseId
    },
    include: {
      documentVersion: true,
      currentCustodian: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  res.json(items.map(serializeEvidence));
}

export async function listOrganizationEvidenceController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;

  const superAdmin = await isSuperAdmin(userId);

  // Get ALL active memberships (not just findFirst)
  const memberships = await prisma.organizationMembership.findMany({
    where: {
      userId,
      status: "ACTIVE"
    }
  });
  const memberOrgIds = memberships.map((m) => m.organizationId);

  if (!superAdmin && memberOrgIds.length === 0) {
    res.json([]);
    return;
  }

  const items = await prisma.evidence.findMany({
    where: superAdmin
      ? {}
      : {
          case: {
            organizationId: { in: memberOrgIds }
          }
        },
    include: {
      case: {
        select: {
          id: true,
          caseNumber: true,
          title: true
        }
      },
      documentVersion: true,
      currentCustodian: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  res.json(items.map(serializeEvidence));
}

export async function listMyTransfersController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const superAdmin = await isSuperAdmin(req.userId!);
    const transfers = await getTransfersForUser(req.userId!, superAdmin);
    res.json(transfers);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch transfers";
    res.status(500).json({ message });
  }
}
