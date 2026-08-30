import { z } from 'zod';

export const createCaseSchema = z.object({
  caseNumber: z.string().min(4, 'Case Number is required'),
  referenceNumber: z.string().min(4, 'Reference Number is required'),
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  caseType: z.enum(['Cyber Crime', 'Financial Fraud', 'Judicial Exhibit', 'Forensic Examination']),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'STANDARD']),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
