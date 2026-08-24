import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../utils/password";
import { AuthenticatedRequest } from "../../middleware/auth";
import {
  createOrganizationSchema,
  createRoleSchema,
  createUserSchema
} from "./organization.schema";

async function getMembership(userId: string, organizationId: string) {
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

export async function createOrganization(req: Request, res: Response) {
  const parsed = createOrganizationSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid request",
      errors: z.treeifyError(parsed.error)
    });
    return;
  }

  const organization = await prisma.organization.create({
    data: parsed.data
  });

  res.status(201).json(organization);
}

export async function createRole(req: AuthenticatedRequest, res: Response) {
  const organizationId = req.params.organizationId as string;
  const userId = req.userId!;

  const membership = await getMembership(userId, organizationId);

  if (!membership) {
    res.status(403).json({
      message: "You are not a member of this organization"
    });
    return;
  }

  if (!hasPermission(membership, "ROLE_CREATE")) {
    res.status(403).json({
      message: "Missing ROLE_CREATE permission"
    });
    return;
  }

  const parsed = createRoleSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid request",
      errors: z.treeifyError(parsed.error)
    });
    return;
  }

  const { name, description, permissionNames } = parsed.data;

  const permissions = await prisma.permission.findMany({
    where: {
      name: {
        in: permissionNames
      }
    }
  });

  if (permissions.length !== permissionNames.length) {
    res.status(400).json({
      message: "One or more permissions do not exist"
    });
    return;
  }

  const role = await prisma.role.create({
    data: {
      name,
      description,
      organizationId,
      permissions: {
        create: permissions.map((permission) => ({
          permissionId: permission.id
        }))
      }
    },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });

  res.status(201).json(role);
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  const organizationId = req.params.organizationId as string;
  const currentUserId = req.userId!;

  const membership = await getMembership(currentUserId, organizationId);

  if (!membership) {
    res.status(403).json({
      message: "You are not a member of this organization"
    });
    return;
  }

  if (!hasPermission(membership, "USER_CREATE")) {
    res.status(403).json({
      message: "Missing USER_CREATE permission"
    });
    return;
  }

  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid request",
      errors: z.treeifyError(parsed.error)
    });
    return;
  }

  const { name, email, password, roleId } = parsed.data;

  const role = await prisma.role.findFirst({
    where: {
      id: roleId,
      organizationId
    }
  });

  if (!role) {
    res.status(400).json({
      message: "Role does not belong to this organization"
    });
    return;
  }

  const existing = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (existing) {
    res.status(409).json({
      message: "User with this email already exists"
    });
    return;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          organizationId,
          roleId
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      memberships: {
        include: {
          role: true
        }
      }
    }
  });

  res.status(201).json(user);
}

export async function getOrganizationUsers(
  req: AuthenticatedRequest,
  res: Response
) {
  const organizationId = req.params.organizationId as string;
  const userId = req.userId!;

  const membership = await getMembership(userId, organizationId);

  if (!membership) {
    res.status(403).json({
      message: "You are not a member of this organization"
    });
    return;
  }

  if (!hasPermission(membership, "USER_READ")) {
    res.status(403).json({
      message: "Missing USER_READ permission"
    });
    return;
  }

  const users = await prisma.organizationMembership.findMany({
    where: {
      organizationId,
      status: "ACTIVE"
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true
        }
      },
      role: true
    }
  });

  res.json(users);
}
