import { z } from 'zod';

export const loginSchema = z.object({
  organizationCode: z.string().min(2, 'Organization Code is required'),
  email: z.string().email('Please enter a valid official government email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
