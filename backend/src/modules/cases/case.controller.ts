import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { createCaseSchema, addParticipantSchema } from "./case.schema";
import { createAuditEvent } from "../audit/audit.service";

async function getOrganizationMembership(
  userId: string,
  organizationId: string
) {
  return prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId
      }
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });
}

function hasPermission(membership: any, permissionName: string) {
  return membership?.role?.permissions?.some(
    (rp: any) => rp.permission.name === permissionName
  );
}

export async function createCase(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const organizationId = req.params.organizationId as string;

  const membership = await getOrganizationMembership(userId, organizationId);

  if (!membership) {
    res.status(403).json({
      message: "You are not a member of this organization"
    });
    return;
  }

  if (!hasPermission(membership, "CASE_CREATE")) {
    res.status(403).json({
      message: "Missing CASE_CREATE permission"
    });
    return;
  }

  const parsed = createCaseSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid request",
      errors: z.treeifyError(parsed.error)
    });
    return;
  }

  const newCase = await prisma.case.create({
    data: {
      organizationId,
      createdById: userId,
      caseNumber: parsed.data.caseNumber,
      title: parsed.data.title,
      description: parsed.data.description,
      participants: {
        create: {
          userId,
          isCaseAdmin: true
        }
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  await createAuditEvent({
    caseId: newCase.id,
    actorId: userId,
    eventType: "CASE_CREATED",
    entityType: "Case",
    entityId: newCase.id,
    metadata: {
      caseNumber: newCase.caseNumber,
      title: newCase.title
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? null
  });

  res.status(201).json(newCase);
}

export async function getCases(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const organizationId = req.params.organizationId as string;

  const membership = await getOrganizationMembership(userId, organizationId);

  if (!membership) {
    res.status(403).json({
      message: "You are not a member of this organization"
    });
    return;
  }

  if (!hasPermission(membership, "CASE_READ")) {
    res.status(403).json({
      message: "Missing CASE_READ permission"
    });
    return;
  }

  const cases = await prisma.case.findMany({
    where: {
      organizationId,
      participants: {
        some: {
          userId,
          status: "ACTIVE"
        }
      }
    },
    include: {
      participants: {
        where: {
          status: "ACTIVE"
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  res.json(cases);
}

export async function getCase(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const caseId = req.params.caseId as string;

  const caseRecord = await prisma.case.findUnique({
    where: {
      id: caseId
    },
    include: {
      organization: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      participants: {
        where: {
          status: "ACTIVE"
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  if (!caseRecord) {
    res.status(404).json({
      message: "Case not found"
    });
    return;
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
    res.status(403).json({
      message: "You are not a participant of this case"
    });
    return;
  }

  res.json(caseRecord);
}

export async function addParticipant(req: AuthenticatedRequest, res: Response) {
  const currentUserId = req.userId!;
  const caseId = req.params.caseId as string;

  const parsed = addParticipantSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid request",
      errors: z.treeifyError(parsed.error)
    });
    return;
  }

  const caseRecord = await prisma.case.findUnique({
    where: {
      id: caseId
    }
  });

  if (!caseRecord) {
    res.status(404).json({
      message: "Case not found"
    });
    return;
  }

  const currentParticipant = await prisma.caseParticipant.findUnique({
    where: {
      caseId_userId: {
        caseId,
        userId: currentUserId
      }
    }
  });

  if (!currentParticipant || currentParticipant.status !== "ACTIVE") {
    res.status(403).json({
      message: "You are not a participant of this case"
    });
    return;
  }

  if (!currentParticipant.isCaseAdmin) {
    res.status(403).json({
      message: "Only case administrators can manage participants"
    });
    return;
  }

  const targetMembership = await prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: parsed.data.userId,
        organizationId: caseRecord.organizationId
      }
    }
  });

  if (!targetMembership || targetMembership.status !== "ACTIVE") {
    res.status(400).json({
      message: "User must be an active member of the case organization"
    });
    return;
  }

  const participant = await prisma.caseParticipant.create({
    data: {
      caseId,
      userId: parsed.data.userId,
      isCaseAdmin: parsed.data.isCaseAdmin
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  await createAuditEvent({
    caseId,
    actorId: currentUserId,
    eventType: "USER_ADDED",
    entityType: "CaseParticipant",
    entityId: participant.id,
    metadata: {
      addedUserId: participant.userId
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? null
  });

  res.status(201).json(participant);
}

export async function getParticipants(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const caseId = req.params.caseId as string;

  const participant = await prisma.caseParticipant.findUnique({
    where: {
      caseId_userId: {
        caseId,
        userId
      }
    }
  });

  if (!participant || participant.status !== "ACTIVE") {
    res.status(403).json({
      message: "You are not a participant of this case"
    });
    return;
  }

  const participants = await prisma.caseParticipant.findMany({
    where: {
      caseId,
      status: "ACTIVE"
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  res.json(participants);
}
