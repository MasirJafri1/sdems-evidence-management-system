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

    if (isSuperAdmin) {
      const events = await getOrganizationAuditHistory(undefined);
      res.json({
        totalEvents: events.length,
        events
      });
      return;
    }

    const memberships = await prisma.organizationMembership.findMany({
      where: { userId, status: "ACTIVE" },
      select: { organizationId: true }
    });
    const myOrgIds = memberships.map((m) => m.organizationId);

    const participantCases = await prisma.caseParticipant.findMany({
      where: { userId, status: "ACTIVE" },
      select: { caseId: true }
    });
    const myCaseIds = participantCases.map((cp) => cp.caseId);

    if (myOrgIds.length === 0 && myCaseIds.length === 0) {
      res.json({
        totalEvents: 0,
        events: []
      });
      return;
    }

    const events = await prisma.auditEvent.findMany({
      where: {
        case: {
          OR: [
            ...(myOrgIds.length > 0 ? [{ organizationId: { in: myOrgIds } }] : []),
            ...(myCaseIds.length > 0 ? [{ id: { in: myCaseIds } }] : [])
          ]
        }
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
            title: true,
            organization: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

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
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = currentUser?.email === "superadmin@gov.in";
    const caseId = req.query.caseId as string | undefined;

    if (caseId) {
      const access = isSuperAdmin ? true : await checkCaseAccess(userId, caseId);
      if (!access) {
        res.status(403).json({ message: "Not authorized to verify this case audit chain." });
        return;
      }
      const result = await verifyCaseAuditChain(caseId);
      res.json({ caseId, ...result });
      return;
    }

    const memberships = await prisma.organizationMembership.findMany({
      where: { userId, status: "ACTIVE" },
      select: { organizationId: true }
    });
    const myOrgIds = memberships.map((m) => m.organizationId);

    const participantCases = await prisma.caseParticipant.findMany({
      where: { userId, status: "ACTIVE" },
      select: { caseId: true }
    });
    const myCaseIds = participantCases.map((cp) => cp.caseId);

    if (!isSuperAdmin && myOrgIds.length === 0 && myCaseIds.length === 0) {
      res.json({
        valid: true,
        totalEvents: 0,
        casesVerified: 0,
        details: []
      });
      return;
    }

    const cases = await prisma.case.findMany({
      where: isSuperAdmin
        ? {}
        : {
            OR: [
              ...(myOrgIds.length > 0 ? [{ organizationId: { in: myOrgIds } }] : []),
              ...(myCaseIds.length > 0 ? [{ id: { in: myCaseIds } }] : [])
            ]
          },
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
