import { z } from "zod";

export const createCaseSchema = z.object({
  caseNumber: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional()
});

export const addParticipantSchema = z.object({
  userId: z.string().min(1),
  isCaseAdmin: z.boolean().default(false)
});
