import { Router, Request, Response } from "express";
import { esClient, SDEMS_SEARCH_INDEX, initElasticsearch } from "./elastic.client";

const router = Router();

router.get("/health", async (_req: Request, res: Response) => {
  try {
    const ping = await esClient.ping();
    let clusterInfo: any = null;
    let indexExists = false;

    if (ping) {
      clusterInfo = await esClient.cluster.health();
      const rawExists: any = await esClient.indices.exists({ index: SDEMS_SEARCH_INDEX });
      indexExists = Boolean(rawExists === true || rawExists?.body === true || rawExists?.statusCode === 200 || rawExists?.status === 200);
      console.log(`[Elasticsearch Health] rawExists:`, rawExists, `indexExists: ${indexExists}`);
    }

    res.json({
      status: ping ? "UP" : "DOWN",
      cluster: clusterInfo?.cluster_name || "unavailable",
      clusterStatus: clusterInfo?.status || "disconnected",
      numberOfNodes: clusterInfo?.number_of_nodes || 0,
      indexExists,
      targetIndex: SDEMS_SEARCH_INDEX
    });
  } catch (err: any) {
    res.status(503).json({
      status: "DOWN",
      error: err.message,
      message: "Elasticsearch is unreachable. Please ensure Elasticsearch is running on port 9200."
    });
  }
});

router.post("/init", async (_req: Request, res: Response) => {
  const result = await initElasticsearch();
  if (result.connected) {
    res.json({ message: "Elasticsearch connected & initialized", ...result });
  } else {
    res.status(503).json({ message: "Failed to initialize Elasticsearch", ...result });
  }
});

router.post("/test-connectors", async (req: Request, res: Response) => {
  const sampleText = req.body?.text || "Ballistics report regarding 9mm ammunition casing recovered from scene";
  
  try {
    const { generateEmbedding } = await import("./embedding.service.js");
    const { generateRetrievalSummary } = await import("./llm.service.js");

    const embedding = await generateEmbedding(sampleText);

    const mockEvidence = [
      {
        id: "ev-test-1",
        title: "Forensic Ballistics Report",
        caseNumber: "CASE-2026-TEST",
        entityType: "DOCUMENT",
        snippet: sampleText,
        sha256Hash: "d9e1b7a2396b133037f4eab178802f4ddd1507275b48fcc12c41f0c7128127c5",
        versionNumber: 1
      }
    ];

    const llmSummary = await generateRetrievalSummary(
      "What evidence was recovered?",
      mockEvidence
    );

    res.json({
      success: true,
      testedText: sampleText,
      embedding: {
        dimensions: embedding.length,
        sampleVector: embedding.slice(0, 5),
        isGenerated: embedding.length > 0
      },
      llm: llmSummary
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

import { authenticate, AuthenticatedRequest } from "../../middleware/auth";
import { resolveUserSearchScope } from "./scope.resolver";
import { executeScopedSearch, indexEntityInElasticsearch } from "./search.service";
import { prisma } from "../../lib/prisma";

/**
 * GET /api/search?q=query&type=ALL|DOCUMENT|EVIDENCE&useAi=true
 * Protected by authenticate middleware. Strictly scoped to user's authorized cases.
 */
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const query = (req.query.q as string) || "";
  const entityType = (req.query.type as "ALL" | "DOCUMENT" | "EVIDENCE") || "ALL";
  const useAi = req.query.useAi === "true" || req.query.ai === "true";
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;

  try {
    const scope = await resolveUserSearchScope(userId);
    const searchResult = await executeScopedSearch(
      {
        query,
        entityType,
        page,
        limit,
        useAiSynthesis: useAi
      },
      scope
    );

    res.json({
      success: true,
      query,
      scope: {
        isSuperAdmin: scope.isSuperAdmin,
        isOrgAdmin: scope.isOrgAdmin,
        authorizedCaseCount: scope.isSuperAdmin ? "ALL" : scope.allowedCaseIds.length
      },
      ...searchResult
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Search query failed",
      error: err.message
    });
  }
});

/**
 * POST /api/search/reindex
 * Administrative route to sync all existing PostgreSQL records into Elasticsearch
 */
router.post("/reindex", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const scope = await resolveUserSearchScope(userId);

  if (!scope.isSuperAdmin && !scope.isOrgAdmin) {
    res.status(403).json({ message: "Only administrators can trigger complete re-indexing." });
    return;
  }

  try {
    // 1. Sync Documents (including in-file text extraction from S3 storage if available)
    const docs = await prisma.document.findMany({
      include: {
        case: true,
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: {
            uploadedBy: { select: { name: true } }
          }
        }
      }
    });

    const { extractTextFromFile } = await import("./extractor.service.js");
    const { s3 } = await import("../../lib/s3.js");
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");

    let indexedDocsCount = 0;
    for (const doc of docs) {
      const latestVer = doc.versions[0];
      let inDocText = "";

      if (latestVer?.storageBucket && latestVer?.storageKey) {
        try {
          const s3Obj = await s3.send(
            new GetObjectCommand({
              Bucket: latestVer.storageBucket,
              Key: latestVer.storageKey
            })
          );
          if (s3Obj.Body) {
            const byteArray = await s3Obj.Body.transformToByteArray();
            const buffer = Buffer.from(byteArray);
            inDocText = await extractTextFromFile(buffer, latestVer.mimeType, latestVer.originalFileName);
          }
        } catch (s3Err: any) {
          console.warn(`[Reindex] Could not fetch file body from storage for doc ${doc.id}:`, s3Err.message);
        }
      }

      const fullContent = [doc.title, doc.description || "", inDocText].filter(Boolean).join("\n\n");

      await indexEntityInElasticsearch({
        id: doc.id,
        entityType: "DOCUMENT",
        title: doc.title,
        content: fullContent,
        summary: doc.description || undefined,
        caseId: doc.caseId,
        caseNumber: doc.case.caseNumber,
        organizationId: doc.case.organizationId,
        documentType: doc.documentType || undefined,
        versionNumber: latestVer?.versionNumber || 1,
        sha256Hash: latestVer?.sha256Hash || undefined,
        status: doc.status,
        uploadedBy: latestVer?.uploadedBy?.name || "Officer",
        createdAt: doc.createdAt
      });
      indexedDocsCount++;
    }

    // 2. Sync Evidence Items
    const evidences = await prisma.evidence.findMany({
      include: {
        case: true,
        documentVersion: {
          select: {
            sha256Hash: true
          }
        },
        currentCustodian: {
          select: {
            name: true
          }
        }
      }
    });

    let indexedEvidenceCount = 0;
    for (const ev of evidences) {
      await indexEntityInElasticsearch({
        id: ev.id,
        entityType: "EVIDENCE",
        title: ev.title,
        content: `${ev.description || ""} Evidence No: ${ev.evidenceNumber}`,
        caseId: ev.caseId,
        caseNumber: ev.case.caseNumber,
        organizationId: ev.case.organizationId,
        serialNumber: ev.evidenceNumber,
        evidenceType: "EXHIBIT",
        sha256Hash: ev.documentVersion?.sha256Hash || undefined,
        status: ev.status,
        uploadedBy: ev.currentCustodian?.name || "Custodian",
        createdAt: ev.createdAt
      });
      indexedEvidenceCount++;
    }

    res.json({
      success: true,
      message: `Successfully re-indexed ${indexedDocsCount} documents and ${indexedEvidenceCount} evidence items.`,
      indexedDocsCount,
      indexedEvidenceCount
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Re-indexing failed",
      error: err.message
    });
  }
});

export default router;
