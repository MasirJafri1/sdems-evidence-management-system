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

  const isSuperAdmin = user.email === "superadmin@gov.in";

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: user.id, status: "ACTIVE" }
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isSuperAdmin,
      organizationId: isSuperAdmin ? null : (membership?.organizationId || null)
    }
  });

}
