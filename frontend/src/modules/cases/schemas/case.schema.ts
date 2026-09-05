import { z } from 'zod';

export const createCaseSchema = z.object({
  caseNumber: z.string().min(4, 'Case Number is required'),
  referenceNumber: z.string().min(4, 'Reference Number is required'),
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(5, 'Description must be at least 5 characters long'),
  caseType: z.string().min(2, 'Case Type is required'),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
