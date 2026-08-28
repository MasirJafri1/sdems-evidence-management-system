import { z } from "zod";

export const grantCasePermissionSchema = z.object({
  userId: z.string().min(1),
  permissionName: z.string().min(1),
  effect: z.enum(["GRANT", "DENY"]).default("GRANT"),
  expiresAt: z.string().datetime().optional()
});

export const revokeCasePermissionSchema = z.object({
  userId: z.string().min(1),
  permissionName: z.string().min(1)
});
