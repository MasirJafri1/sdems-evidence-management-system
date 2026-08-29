import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../utils/password";

const bootstrapSchema = z.object({
  organizationName: z.string().min(2),
  organizationCode: z.string().min(2),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8)
});

export async function bootstrap(req: Request, res: Response) {
  const parsed = bootstrapSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid request",
      errors: z.treeifyError(parsed.error)
    });
    return;
  }

  const {
    organizationName,
    organizationCode,
    adminName,
    adminEmail,
    adminPassword
  } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: {
      email: adminEmail
    }
  });

  if (existing) {
    res.status(409).json({
      message: "Admin user already exists"
    });
    return;
  }

  const passwordHash = await hashPassword(adminPassword);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        code: organizationCode
      }
    });

    const permissions = await tx.permission.findMany();

    const adminRole = await tx.role.create({
      data: {
        name: "Organization Admin",
        description: "Administrative role for the organization",
        organizationId: organization.id,
        permissions: {
          create: permissions.map((permission) => ({
            permissionId: permission.id
          }))
        }
      }
    });

    const user = await tx.user.create({
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

    return {
      organization,
      adminRole,
      user
    };
  });

  res.status(201).json(result);
}
