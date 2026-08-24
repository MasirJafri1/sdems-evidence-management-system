import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(2),
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code must contain only uppercase letters, numbers, _ or -"
    ),
  description: z.string().optional()
});

export const createRoleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissionNames: z.array(z.string()).min(1)
});

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.string().min(1)
});
