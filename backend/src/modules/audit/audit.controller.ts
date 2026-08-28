import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { getCaseAuditHistory, verifyCaseAuditChain } from "./audit.service";

async function checkCaseAccess(userId: string, caseId: string) {
  const caseRecord = await prisma.case.findUnique({
    where: {
      id: caseId
    }
  });

  if (!caseRecord) {
    return null;
  }

  const participant = await prisma.caseParticipant.findUnique({
    where: {
      caseId_userId: {
        caseId,
        userId
      }
    }
  });

  if (!participant || participant.status !== "ACTIVE") {
    return null;
  }

  return {
    caseRecord,
    participant
  };
}

export async function getAuditHistory(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const caseId = req.params.caseId as string;

  const access = await checkCaseAccess(userId, caseId);

  if (!access) {
    res.status(403).json({
      message: "You are not authorized to view this case audit history"
    });
    return;
  }

  const events = await getCaseAuditHistory(caseId);

  res.json({
    caseId,
    totalEvents: events.length,
    events
  });
}

export async function verifyAuditChain(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const caseId = req.params.caseId as string;

  const access = await checkCaseAccess(userId, caseId);

  if (!access) {
    res.status(403).json({
      message: "You are not authorized to verify this case audit history"
    });
    return;
  }

  const result = await verifyCaseAuditChain(caseId);

  res.json({
    caseId,
    ...result
  });
}
