import { prisma } from "../../lib/prisma";

export async function getCaseIdFromDocument(
  documentId: string
): Promise<string | null> {
  const document = await prisma.document.findUnique({
    where: {
      id: documentId
    },
    select: {
      caseId: true
    }
  });

  return document?.caseId ?? null;
}

export async function getCaseIdFromEvidence(
  evidenceId: string
): Promise<string | null> {
  const evidence = await prisma.evidence.findUnique({
    where: {
      id: evidenceId
    },
    select: {
      caseId: true
    }
  });

  return evidence?.caseId ?? null;
}
