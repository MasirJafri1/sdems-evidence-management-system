import { Router, Request, Response } from "express";
import { esClient, SDEMS_SEARCH_INDEX, initElasticsearch } from "./elastic.client";
import { authenticate, AuthenticatedRequest } from "../../middleware/auth";
import { resolveUserSearchScope } from "./scope.resolver";
import { executeScopedSearch } from "./search.service";
import { reindexAllInElasticsearch } from "./document-indexer.service";

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

router.post("/init", async (req: Request, res: Response) => {
  const reset = req.body?.reset === true;
  const result = await initElasticsearch(reset);
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
    const { documentsIndexed, evidenceIndexed } = await reindexAllInElasticsearch();

    res.json({
      success: true,
      message: `Successfully re-indexed ${documentsIndexed} documents and ${evidenceIndexed} evidence items.`,
      indexedDocsCount: documentsIndexed,
      indexedEvidenceCount: evidenceIndexed
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
