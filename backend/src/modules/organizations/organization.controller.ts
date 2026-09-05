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
      message: "Invalid request. Admin assignment is compulsory.",
      errors: z.treeifyError(parsed.error)
    });
    return;
  }

  const {
    name,
    code,
    description,
    adminType,
    existingUserId,
    adminName,
    adminEmail,
    adminPassword
  } = parsed.data;

  const isExistingUser = adminType === "EXISTING" || (existingUserId && !adminEmail);

  if (isExistingUser && existingUserId) {
    const existingUser = await prisma.user.findUnique({
      where: { id: existingUserId }
    });

    if (!existingUser) {
      res.status(404).json({
        message: "Selected existing officer was not found."
      });
      return;
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        code,
        description
      }
    });

    const allPermissions = await prisma.permission.findMany({});
    const adminRole = await prisma.role.create({
      data: {
        name: "Organization Admin",
        description: `Full administrative authority over ${organization.name}`,
        organizationId: organization.id,
        permissions: {
          create: allPermissions.map((p) => ({ permissionId: p.id }))
        }
      }
    });

    await prisma.organizationMembership.create({
      data: {
        userId: existingUser.id,
        organizationId: organization.id,
        roleId: adminRole.id
      }
    });

    res.status(201).json({
      organization,
      adminRole,
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email
      }
    });
    return;
  }

  // Provision New Organization & Admin User
  const organization = await prisma.organization.create({
    data: {
      name,
      code,
      description
    }
  });

  const allPermissions = await prisma.permission.findMany({});
  const adminRole = await prisma.role.create({
    data: {
      name: "Organization Admin",
      description: `Full administrative authority over ${organization.name}`,
      organizationId: organization.id,
      permissions: {
        create: allPermissions.map((p) => ({ permissionId: p.id }))
      }
    }
  });

  let createdUser = null;

  if (adminEmail && adminPassword && adminName) {
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existing) {
      res.status(409).json({
        message: "Admin user with this email already exists"
      });
      return;
    }

    const passwordHash = await hashPassword(adminPassword);
    createdUser = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        memberships: {
          create: {
            organizationId: organization.id,
            roleId: adminRole.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
  }

  res.status(201).json({
    organization,
    adminRole,
    user: createdUser
  });
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

  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId }
  });

  const isSuperAdmin = currentUser?.email === "superadmin@gov.in";

  if (!isSuperAdmin) {
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
  }

  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid request",
      errors: z.treeifyError(parsed.error)
    });
    return;
  }

  const { mode, existingUserId, name, email, password, roleId, roleName, permissions } = parsed.data;

  // Resolve or create Custom Role with dynamic permissions
  let role: any = null;
  const targetRoleName = roleName && roleName.trim() ? roleName.trim() : "Investigating Officer";

  if (roleId) {
    role = await prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId
      }
    });
  }

  if (!role) {
    role = await prisma.role.findFirst({
      where: {
        organizationId,
        name: targetRoleName
      }
    });
  }

  if (!role) {
    let permRecords: any[] = [];
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      permRecords = await prisma.permission.findMany({
        where: { name: { in: permissions } }
      });
    } else {
      permRecords = await prisma.permission.findMany({});
    }

    role = await prisma.role.create({
      data: {
        name: targetRoleName,
        description: `Custom organization role: ${targetRoleName}`,
        organizationId,
        permissions: {
          create: permRecords.map((p) => ({ permissionId: p.id }))
        }
      }
    });
  } else if (permissions && Array.isArray(permissions) && permissions.length > 0) {
    // Sync permissions if explicit checkboxes were passed
    const permRecords = await prisma.permission.findMany({
      where: { name: { in: permissions } }
    });
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });
    await prisma.rolePermission.createMany({
      data: permRecords.map((p) => ({ roleId: role.id, permissionId: p.id }))
    });
  }

  // 1. Enroll User from Another Org or Unassigned User (by existingUserId or email)
  let targetUser = null;

  if (existingUserId) {
    targetUser = await prisma.user.findUnique({
      where: { id: existingUserId }
    });
  } else if (email) {
    targetUser = await prisma.user.findUnique({
      where: { email }
    });
  }

  if (targetUser) {
    const existingMembership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUser.id,
          organizationId
        }
      }
    });

    if (existingMembership) {
      res.status(409).json({
        message: "User is already enrolled in this organization"
      });
      return;
    }

    const membership = await prisma.organizationMembership.create({
      data: {
        userId: targetUser.id,
        organizationId,
        roleId: role.id
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

    res.status(201).json(membership);
    return;
  }

  // 2. Provision Brand New User Account
  if (!name || !email || !password) {
    res.status(400).json({
      message: "Name, Email, and Password are required to provision a new user."
    });
    return;
  }

  const passwordHash = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          organizationId,
          roleId: role.id
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

  res.status(201).json(newUser);
}

export async function getOrganizationUsers(
  req: AuthenticatedRequest,
  res: Response
) {
  const organizationId = req.params.organizationId as string;
  const userId = req.userId!;

  const reqUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  const isSuperAdmin = reqUser?.email === "superadmin@gov.in";

  // Global Super Admin can view all users across all organizations
  if (isSuperAdmin) {
    const allUsers = await prisma.organizationMembership.findMany({
      where: {
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
        organization: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        role: true
      }
    });

    res.json(allUsers);
    return;
  }

  // Org Admin / Member can ONLY view users of their enrolled organization
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
      organization: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      role: true
    }
  });

  res.json(users);
}


export async function lookupUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string" || !query.trim()) {
      res.status(400).json({ found: false, message: "Email or User ID is required for lookup" });
      return;
    }

    const trimmed = query.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmed, mode: "insensitive" } },
          { id: trimmed }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        memberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ found: false, message: "No registered officer found with that Email or User ID." });
      return;
    }

    res.json({ found: true, user });
  } catch (error: any) {
    res.status(500).json({ found: false, message: "Failed to perform user lookup" });
  }
}

export async function getAllRegisteredOfficers(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId;
    const currentUser = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    const isSuperAdmin = currentUser?.email === "superadmin@gov.in";

    if (!isSuperAdmin) {
      res.status(403).json({ message: "Access denied. Global directory browsing is disabled. Search users by Email or ID." });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        memberships: {
          include: {
            organization: {
              select: {
                name: true,
                code: true
              }
            },
            role: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to retrieve registered officers" });
  }
}

export async function getAllOrganizations(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId;
    let isSuperAdmin = false;

    if (userId) {
      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      isSuperAdmin = currentUser?.email === "superadmin@gov.in";
    }

    const whereClause: any = {};
    if (!isSuperAdmin && userId) {
      whereClause.memberships = {
        some: {
          userId,
          status: "ACTIVE"
        }
      };
    }

    const orgs = await prisma.organization.findMany({
      where: whereClause,
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true
              }
            },
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            cases: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orgs);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to retrieve organizations" });
  }
}


