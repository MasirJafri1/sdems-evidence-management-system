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
  description: z.string().optional(),
  adminType: z.enum(["NEW", "EXISTING"]).optional(),
  existingUserId: z.string().optional(),
  adminName: z.string().min(2).optional(),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(6).optional()
}).refine((data) => {
  if (data.adminType === "EXISTING" || (data.existingUserId && !data.adminEmail)) {
    return !!data.existingUserId;
  }
  if (data.adminType === "NEW" || data.adminEmail) {
    return !!(data.adminName && data.adminEmail && data.adminPassword);
  }
  return true;
}, {
  message: "Compulsory: Either select an existing registered officer or enter details to create a new admin user."
});


export const createRoleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissionNames: z.array(z.string()).min(1)
});

export const createUserSchema = z.object({
  mode: z.enum(["EXISTING", "NEW"]).optional(),
  existingUserId: z.string().optional(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  roleId: z.string().optional(),
  roleName: z.string().optional(),
  permissions: z.array(z.string()).optional()
});
