import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(5000).optional(),
  documentType: z.string().max(100).optional()
});
