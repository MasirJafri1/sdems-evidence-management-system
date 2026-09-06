import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { getCaseAuditHistory, verifyCaseAuditChain, getOrganizationAuditHistory } from "./audit.service";

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

export async function getAuditEvents(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId!;
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = currentUser?.email === "superadmin@gov.in";

    const membership = await prisma.organizationMembership.findFirst({
      where: { userId, status: "ACTIVE" }
    });

    const orgId = isSuperAdmin ? undefined : membership?.organizationId;
    const events = await getOrganizationAuditHistory(orgId);

    res.json({
      totalEvents: events.length,
      events
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch audit events", error: error.message });
  }
}

export async function verifyAuditChainGeneral(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId!;
    const caseId = req.query.caseId as string | undefined;

    if (caseId) {
      const result = await verifyCaseAuditChain(caseId);
      res.json({ caseId, ...result });
      return;
    }

    const membership = await prisma.organizationMembership.findFirst({
      where: { userId, status: "ACTIVE" }
    });

    const cases = await prisma.case.findMany({
      where: membership ? { organizationId: membership.organizationId } : {},
      take: 20
    });

    let totalEvents = 0;
    let allValid = true;
    const caseResults: any[] = [];

    for (const c of cases) {
      const r = await verifyCaseAuditChain(c.id);
      totalEvents += r.totalEvents;
      if (!r.valid) allValid = false;
      caseResults.push({ caseNumber: c.caseNumber, ...r });
    }

    res.json({
      valid: allValid,
      totalEvents,
      casesVerified: cases.length,
      details: caseResults
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to verify audit chain", error: error.message });
  }
}
