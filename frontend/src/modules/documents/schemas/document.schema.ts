import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  caseNumber: z.string().min(4, 'Case Number is required'),
  documentType: z.string().min(2, 'Document Type is required'),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
