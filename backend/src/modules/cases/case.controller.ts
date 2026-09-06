import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { createCaseSchema, addParticipantSchema } from "./case.schema";
import { createAuditEvent } from "../audit/audit.service";
import { checkCasePermission, grantCasePermission } from "../authorization/authorization.service";

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

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  const isSuperAdmin = currentUser?.email === "superadmin@gov.in";

  if (!isSuperAdmin) {
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
      referenceNumber: parsed.data.referenceNumber ?? null,
      title: parsed.data.title,
      description: parsed.data.description,
      caseType: parsed.data.caseType ?? null,
      participants: {
        create: {
          userId,
          isCaseAdmin: true
        }
      }
    } as any,
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

  const currentUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  const isSuperAdmin = currentUser?.email === "superadmin@gov.in";

  // 1. Global Super Admin can view ALL cases across ALL organizations
  if (isSuperAdmin) {
    const whereClause: any = {};
    if (organizationId && organizationId !== "all") {
      whereClause.organizationId = organizationId;
    }

    const cases = await prisma.case.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            evidence: true,
            documents: true
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
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(cases);
    return;
  }

  // 2. Regular User: View cases across enrolled orgs or where user is an active participant
  const userMemberships = await prisma.organizationMembership.findMany({
    where: {
      userId,
      status: "ACTIVE"
    },
    select: {
      organizationId: true
    }
  });

  const enrolledOrgIds = userMemberships.map((m) => m.organizationId);

  let whereClause: any;

  if (organizationId && organizationId !== "all") {
    whereClause = {
      organizationId,
      OR: [
        { organizationId: { in: enrolledOrgIds } },
        { participants: { some: { userId, status: "ACTIVE" } } }
      ]
    };
  } else {
    whereClause = {
      OR: [
        { organizationId: { in: enrolledOrgIds } },
        { participants: { some: { userId, status: "ACTIVE" } } }
      ]
    };
  }

  const cases = await prisma.case.findMany({
    where: whereClause,
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      _count: {
        select: {
          evidence: true,
          documents: true
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

  const authResult = await checkCasePermission({
    userId,
    caseId,
    permissionName: "CASE_READ"
  });

  if (!authResult.allowed) {
    res.status(403).json({
      message: "Forbidden",
      reason: authResult.reason
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

  const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
  const isSuperAdmin = currentUser?.email === "superadmin@gov.in";

  if (!isSuperAdmin) {
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
  }

  /*
   * Cross-Organization Support:
   * Target user must have an active organization membership in ANY organization,
   * not restricted to caseRecord.organizationId.
   */
  const targetMembership = await prisma.organizationMembership.findFirst({
    where: {
      userId: parsed.data.userId,
      status: "ACTIVE"
    }
  });

  if (!targetMembership) {
    res.status(400).json({
      message: "User must have an active organization membership"
    });
    return;
  }

  const participant = await prisma.caseParticipant.upsert({
    where: {
      caseId_userId: {
        caseId,
        userId: parsed.data.userId
      }
    },
    update: {
      isCaseAdmin: parsed.data.isCaseAdmin,
      status: "ACTIVE"
    },
    create: {
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

  // Grant Case-Level Permissions from Checkboxes
  if (parsed.data.permissions && Array.isArray(parsed.data.permissions)) {
    for (const permName of parsed.data.permissions) {
      try {
        await grantCasePermission(
          caseId,
          parsed.data.userId,
          permName,
          "GRANT",
          currentUserId
        );
      } catch (e) {
        // ignore if permission does not exist
      }
    }
  }

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

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  const isSuperAdmin = currentUser?.email === "superadmin@gov.in";

  if (!isSuperAdmin) {
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
          email: true,
          casePermissions: {
            where: { caseId },
            include: { permission: true }
          }
        }
      }
    }
  });

  res.json(participants);
}

// ----------------------------------------------------------------------------
// EXTERNAL CASE ACCESS
// ----------------------------------------------------------------------------

export async function requestCaseAccess(req: AuthenticatedRequest, res: Response) {
  try {
    const { caseNumber, reason } = req.body;
    const userId = req.userId!;

    const caseRec = await prisma.case.findFirst({
      where: { caseNumber }
    });
    
    if (!caseRec) {
      res.status(404).json({ message: "Case not found with the provided case number." });
      return;
    }

    const existingParticipant = await prisma.caseParticipant.findUnique({
      where: { caseId_userId: { caseId: caseRec.id, userId } }
    });

    if (existingParticipant && existingParticipant.status === "ACTIVE") {
      res.status(400).json({ message: "You are already an active participant in this case." });
      return;
    }

    const reqRecord = await prisma.caseAccessRequest.upsert({
      where: { caseId_userId: { caseId: caseRec.id, userId } },
      update: { status: "PENDING", reason },
      create: { caseId: caseRec.id, userId, reason, status: "PENDING" }
    });

    res.status(201).json(reqRecord);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

export async function listCaseAccessRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const caseId = req.params.caseId as string | undefined;
    const userId = req.userId!;

    if (caseId) {
      const requests = await prisma.caseAccessRequest.findMany({
        where: { caseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              memberships: {
                include: { organization: { select: { id: true, name: true, code: true } } }
              }
            }
          },
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
              organization: { select: { id: true, name: true, code: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      res.json(requests);
      return;
    }

    const membership = await prisma.organizationMembership.findFirst({
      where: { userId, status: "ACTIVE" }
    });

    const requests = await prisma.caseAccessRequest.findMany({
      where: {
        OR: [
          { userId },
          ...(membership ? [{ case: { organizationId: membership.organizationId } }] : [])
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            memberships: {
              include: { organization: { select: { id: true, name: true, code: true } } }
            }
          }
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            organization: { select: { id: true, name: true, code: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

export async function resolveCaseAccessRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const requestId = req.params.id as string;
    const { action } = req.body; // 'APPROVE' | 'REJECT'
    const approverId = req.userId!;

    const accessReq = await prisma.caseAccessRequest.findUnique({
      where: { id: requestId },
      include: { case: true }
    });
    
    if (!accessReq) {
      res.status(404).json({ message: "Access request not found" });
      return;
    }
    
    if (accessReq.status !== "PENDING") {
      res.status(400).json({ message: "Access request is already resolved" });
      return;
    }

    const currentUser = await prisma.user.findUnique({ where: { id: approverId } });
    const isSuperAdmin = currentUser?.email === "superadmin@gov.in";

    const approverParticipant = await prisma.caseParticipant.findUnique({
      where: { caseId_userId: { caseId: accessReq.caseId, userId: approverId } }
    });
    const isCaseAdmin = approverParticipant?.isCaseAdmin;

    const isOrgMember = await prisma.organizationMembership.findFirst({
      where: {
        organizationId: accessReq.case.organizationId,
        userId: approverId,
        status: "ACTIVE"
      }
    });

    if (!isSuperAdmin && !isCaseAdmin && !isOrgMember) {
      res.status(403).json({ message: "Only case or organization administrators can approve access requests" });
      return;
    }

    const updatedReq = await prisma.$transaction(async (tx) => {
      const uReq = await tx.caseAccessRequest.update({
        where: { id: requestId },
        data: { status: action === 'APPROVE' ? "APPROVED" : "REJECTED" }
      });

      if (action === 'APPROVE') {
        await tx.caseParticipant.upsert({
          where: { caseId_userId: { caseId: accessReq.caseId, userId: accessReq.userId } },
          update: { status: "ACTIVE", removedAt: null },
          create: { caseId: accessReq.caseId, userId: accessReq.userId, status: "ACTIVE" }
        });

        const readPerms = await tx.permission.findMany({
          where: { name: { in: ['CASE_READ', 'DOCUMENT_READ', 'EVIDENCE_READ'] } }
        });
        
        for (const p of readPerms) {
          await tx.casePermission.upsert({
            where: {
              caseId_userId_permissionId: {
                caseId: accessReq.caseId,
                userId: accessReq.userId,
                permissionId: p.id
              }
            },
            update: { effect: "GRANT" },
            create: {
              caseId: accessReq.caseId,
              userId: accessReq.userId,
              permissionId: p.id,
              createdById: approverId
            }
          });
        }
      }
      return uReq;
    });

    res.json(updatedReq);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

export async function verifyCase(req: AuthenticatedRequest, res: Response) {
  try {
    const caseNumber = req.params.caseNumber as string;
    if (!caseNumber) {
      res.status(400).json({ valid: false, message: "Case number is required" });
      return;
    }
    const caseRec = await prisma.case.findFirst({
      where: { caseNumber }
    });
    
    if (caseRec) {
      res.json({ valid: true, caseId: caseRec.id, title: caseRec.title });
    } else {
      res.json({ valid: false });
    }
  } catch (error: any) {
    res.status(500).json({ valid: false, message: "Internal server error" });
  }
}
