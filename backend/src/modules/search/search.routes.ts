import { Router, Request, Response } from "express";
import { esClient, SDEMS_SEARCH_INDEX, ensureOpenSearchInitialized } from "./elastic.client";
import { authenticate, AuthenticatedRequest } from "../../middleware/auth";
import { resolveUserSearchScope } from "./scope.resolver";
import { executeScopedSearch } from "./search.service";
import { reindexAllInElasticsearch } from "./document-indexer.service";

const router = Router();

/**
 * GET /api/search/health
 * Public/protected OpenSearch health & diagnostics endpoint
 */
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const init = await ensureOpenSearchInitialized();
    if (!init.connected) {
      res.json({
        connected: false,
        index: SDEMS_SEARCH_INDEX,
        indexExists: false,
        documentCount: 0,
        error: init.error || "OpenSearch ping failed"
      });
      return;
    }

    const rawExists: any = await esClient.indices.exists({ index: SDEMS_SEARCH_INDEX });
    const indexExists = Boolean(rawExists === true || rawExists?.body === true || rawExists?.statusCode === 200 || rawExists?.status === 200);

    let documentCount = 0;
    if (indexExists) {
      try {
        const countRes: any = await esClient.count({ index: SDEMS_SEARCH_INDEX });
        documentCount = countRes?.body?.count ?? countRes?.count ?? 0;
      } catch (err: any) {
        console.warn("[SearchRoutes] Document count check failed:", err.message);
      }
    }

    res.json({
      connected: true,
      index: SDEMS_SEARCH_INDEX,
      indexExists,
      documentCount
    });
  } catch (err: any) {
    res.status(503).json({
      connected: false,
      index: SDEMS_SEARCH_INDEX,
      indexExists: false,
      documentCount: 0,
      error: err.message
    });
  }
});

/**
 * POST /api/search/init
 */
router.post("/init", async (req: Request, res: Response) => {
  const reset = req.body?.reset === true;
  const result = await ensureOpenSearchInitialized(reset);
  if (result.connected) {
    res.json({ message: "OpenSearch connected & initialized", ...result });
  } else {
    res.status(503).json({ message: "Failed to initialize OpenSearch", ...result });
  }
});

/**
 * POST /api/search/test-connectors
 */
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
        entityType: "DOCUMENT" as const,
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
        dimensions: embedding ? embedding.length : 0,
        sampleVector: embedding ? embedding.slice(0, 5) : [],
        isGenerated: Boolean(embedding && embedding.length > 0)
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
        adminOrganizationIds: scope.adminOrganizationIds,
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
 * Administrative route to sync all existing PostgreSQL records into OpenSearch
 */
router.post("/reindex", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const scope = await resolveUserSearchScope(userId);

  if (!scope.isSuperAdmin && !scope.isOrgAdmin) {
    res.status(403).json({ message: "Only administrators can trigger complete re-indexing." });
    return;
  }

  try {
    const report = await reindexAllInElasticsearch();

    res.json({
      success: true,
      message: `Reindex finished in ${report.durationMs}ms: attempted=${report.attempted}, successful=${report.successful}, failed=${report.failed}`,
      report
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
