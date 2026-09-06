import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { comparePassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";
import { loginSchema } from "./auth.schema";

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid request",
      errors: z.treeifyError(parsed.error)
    });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) {
    res.status(401).json({
      message: "Invalid email or password"
    });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({
      message: "User is inactive"
    });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);

  if (!valid) {
    res.status(401).json({
      message: "Invalid email or password"
    });
    return;
  }

  const token = signToken({
    userId: user.id
  });

  const isSuperAdmin = user.email.trim().toLowerCase() === "superadmin@gov.in";

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    include: {
      organization: true,
      role: true
    }
  });

  const organization = isSuperAdmin
    ? (membership?.organization
        ? { id: membership.organization.id, name: membership.organization.name, code: membership.organization.code }
        : { id: "global", name: "Government of India (Super Admin)", code: "GOV-SUPER" })
    : membership?.organization
    ? {
        id: membership.organization.id,
        name: membership.organization.name,
        code: membership.organization.code
      }
    : null;

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isSuperAdmin,
      organizationId: membership?.organizationId || (isSuperAdmin ? "global" : null),
      organization
    }
  });
}
