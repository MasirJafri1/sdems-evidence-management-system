import { esClient, SDEMS_SEARCH_INDEX, isOpenSearch } from "./elastic.client";
import { generateEmbedding } from "./embedding.service";
import { UserSearchScope } from "./scope.resolver";
import { generateRetrievalSummary, RetrievalContextItem } from "./llm.service";
import { prisma } from "../../lib/prisma";

export interface IndexDocumentPayload {
  id: string;
  entityType: "DOCUMENT" | "EVIDENCE";
  title: string;
  content?: string;
  summary?: string;
  caseId: string;
  caseNumber: string;
  organizationId: string;
  allowedUserIds?: string[];
  classification?: string;
  serialNumber?: string;
  evidenceType?: string;
  documentType?: string;
  versionNumber?: number;
  sha256Hash?: string;
  blockchainAnchorId?: string;
  tags?: string[];
  status?: string;
  uploadedBy?: string;
  createdAt?: Date | string;
}

/**
 * Indexes or updates a document/evidence entity in Elasticsearch or AWS OpenSearch.
 * Computes vector embeddings in the background to avoid blocking critical transactions.
 */
export async function indexEntityInElasticsearch(payload: IndexDocumentPayload): Promise<void> {
  try {
    const textToEmbed = `${payload.title} ${payload.content || ""} ${payload.summary || ""} ${payload.serialNumber || ""} ${payload.evidenceType || ""}`.trim();
    
    // Generate embedding (from OpenRouter or fallback)
    const embedding = await generateEmbedding(textToEmbed);

    const docData = {
      ...payload,
      createdAt: payload.createdAt ? new Date(payload.createdAt).toISOString() : new Date().toISOString(),
      embedding
    };

    const indexPayload: any = {
      index: SDEMS_SEARCH_INDEX,
      id: payload.id,
      refresh: "wait_for"
    };

    if (isOpenSearch) {
      indexPayload.body = docData;
    } else {
      indexPayload.document = docData;
    }

    await esClient.index(indexPayload);

    console.log(`[Elasticsearch] Indexed ${payload.entityType} "${payload.title}" (${payload.id}) under Case "${payload.caseNumber}".`);
  } catch (err: any) {
    console.warn(`[Elasticsearch] Failed to index ${payload.entityType} (${payload.id}):`, err.message);
  }
}

export interface SearchQueryOptions {
  query: string;
  entityType?: "ALL" | "DOCUMENT" | "EVIDENCE";
  page?: number;
  limit?: number;
  useAiSynthesis?: boolean;
}

export interface SearchHitItem {
  id: string;
  entityType: "DOCUMENT" | "EVIDENCE";
  title: string;
  content: string;
  caseId: string;
  caseNumber: string;
  organizationId: string;
  serialNumber?: string;
  evidenceType?: string;
  documentType?: string;
  versionNumber?: number;
  sha256Hash?: string;
  score: number;
  highlightSnippet?: string;
  uploadedBy?: string;
  createdAt: string;
}

/**
 * Executes a scoped hybrid search (BM25 + Semantic Vector + Strict RBAC Scope Filtering).
 * Guaranteed Zero Data Leakage: Documents outside the user's permitted case/org are excluded at query time.
 *
 * Updated to support multi-organization scoping:
 * - SuperAdmin: no filters
 * - Org Admin(s): terms filter on all admin org IDs + participated case IDs
 * - Regular user: terms filter on participated case IDs only
 */
export async function executeScopedSearch(
  options: SearchQueryOptions,
  scope: UserSearchScope
): Promise<{
  total: number;
  hits: SearchHitItem[];
  aiSummary?: string;
  aiModel?: string;
  aiLatencyMs?: number;
}> {
  const { query, entityType = "ALL", page = 1, limit = 20, useAiSynthesis = false } = options;
  const from = (page - 1) * limit;

  // 1. Build Strict Security Filters
  const mustFilters: any[] = [];

  if (!scope.isSuperAdmin) {
    if (scope.adminOrganizationIds.length > 0) {
      // Org Admin: can see everything in admin orgs + explicitly participated cases
      const shouldClauses: any[] = [
        { terms: { organizationId: scope.adminOrganizationIds } }
      ];

      if (scope.allowedCaseIds.length > 0) {
        shouldClauses.push({ terms: { caseId: scope.allowedCaseIds } });
      }

      shouldClauses.push({ term: { allowedUserIds: scope.userId } });

      mustFilters.push({
        bool: {
          should: shouldClauses,
          minimum_should_match: 1
        }
      });
    } else {
      // Regular user: strictly restricted to allowed cases or explicitly assigned documents
      if (scope.allowedCaseIds.length === 0) {
        // User is not participant in any case -> return 0 results
        return { total: 0, hits: [] };
      }

      mustFilters.push({
        bool: {
          should: [
            { terms: { caseId: scope.allowedCaseIds } },
            { term: { allowedUserIds: scope.userId } }
          ],
          minimum_should_match: 1
        }
      });
    }
  }

  // Filter by entity type if requested
  if (entityType && entityType !== "ALL") {
    mustFilters.push({ term: { entityType } });
  }

  // 2. Query Text & kNN Vector Construction
  const queryEmbedding = query.trim() ? await generateEmbedding(query) : [];

  let esQuery: any;

  if (!query.trim()) {
    // Empty query -> Match all within authorized scope
    esQuery = {
      bool: {
        must: [{ match_all: {} }],
        filter: mustFilters
      }
    };
  } else {
    // Hybrid: BM25 text match + Fuzzy Serial + Wildcard
    esQuery = {
      bool: {
        must: [
          {
            bool: {
              should: [
                {
                  multi_match: {
                    query,
                    fields: [
                      "title^3",
                      "content",
                      "summary^2",
                      "serialNumber^4",
                      "caseNumber^3",
                      "evidenceType^2",
                      "tags^2"
                    ],
                    fuzziness: "AUTO"
                  }
                },
                {
                  match: {
                    "title.ngram": {
                      query,
                      boost: 2
                    }
                  }
                }
              ],
              minimum_should_match: 1
            }
          }
        ],
        filter: mustFilters
      }
    };
  }

  // Add kNN vector clause for OpenSearch inside bool query
  if (isOpenSearch && queryEmbedding && queryEmbedding.length > 0) {
    if (!esQuery.bool.should) {
      esQuery.bool.should = [];
    }
    esQuery.bool.should.push({
      knn: {
        embedding: {
          vector: queryEmbedding,
          k: 10
        }
      }
    });
  }

  let searchRequest: any;

  if (isOpenSearch) {
    searchRequest = {
      index: SDEMS_SEARCH_INDEX,
      body: {
        from,
        size: limit,
        query: esQuery,
        highlight: {
          require_field_match: false,
          fields: {
            title: { number_of_fragments: 0 },
            content: {
              fragment_size: 160,
              number_of_fragments: 3,
              no_match_size: 160
            },
            summary: { number_of_fragments: 0 },
            serialNumber: { number_of_fragments: 0 }
          },
          pre_tags: ["<mark>"],
          post_tags: ["</mark>"]
        }
      }
    };
  } else {
    searchRequest = {
      index: SDEMS_SEARCH_INDEX,
      from,
      size: limit,
      query: esQuery,
      highlight: {
        require_field_match: false,
        fields: {
          title: { number_of_fragments: 0 },
          content: {
            fragment_size: 160,
            number_of_fragments: 3,
            no_match_size: 160
          },
          summary: { number_of_fragments: 0 },
          serialNumber: { number_of_fragments: 0 }
        },
        pre_tags: ["<mark>"],
        post_tags: ["</mark>"]
      }
    };

    if (queryEmbedding && queryEmbedding.length > 0) {
      searchRequest.knn = {
        field: "embedding",
        query_vector: queryEmbedding,
        k: 10,
        num_candidates: 50,
        filter: mustFilters
      };
    }
  }

  try {
    const rawResponse: any = await esClient.search(searchRequest);
    const esResponse: any = rawResponse.body ?? rawResponse;
    const totalHits = typeof esResponse.hits?.total === "number"
      ? esResponse.hits.total
      : esResponse.hits?.total?.value || 0;

    const hits: SearchHitItem[] = (esResponse.hits?.hits || []).map((h: any) => {
      const src = h._source || {};
      const highlightedTitle = h.highlight?.title?.[0] || src.title;
      let highlightSnippet = "";

      if (h.highlight?.content && h.highlight.content.length > 0) {
        highlightSnippet = h.highlight.content.join(" ... ");
      } else if (h.highlight?.summary && h.highlight.summary.length > 0) {
        highlightSnippet = h.highlight.summary.join(" ... ");
      } else if (h.highlight && Object.keys(h.highlight).length > 0) {
        const nonTitleFragments = Object.entries(h.highlight)
          .filter(([key]) => key !== "title")
          .flatMap(([, vals]) => vals as string[]);
        if (nonTitleFragments.length > 0) {
          highlightSnippet = nonTitleFragments.join(" ... ");
        }
      }

      if (!highlightSnippet) {
        if (src.content) {
          highlightSnippet = src.content.slice(0, 180) + "...";
        } else {
          highlightSnippet = src.summary || src.title;
        }
      }

      return {
        id: src.id || h._id,
        entityType: src.entityType,
        title: highlightedTitle,
        content: src.content || "",
        caseId: src.caseId,
        caseNumber: src.caseNumber,
        organizationId: src.organizationId,
        serialNumber: src.serialNumber,
        evidenceType: src.evidenceType,
        documentType: src.documentType,
        versionNumber: src.versionNumber,
        sha256Hash: src.sha256Hash,
        score: h._score || 0,
        highlightSnippet,
        uploadedBy: src.uploadedBy,
        createdAt: src.createdAt
      };
    });

    // 3. Optional Groq RAG / Forensic AI Summary
    let aiSummary: string | undefined;
    let aiModel: string | undefined;
    let aiLatencyMs: number | undefined;

    if (useAiSynthesis && hits.length > 0 && query.trim()) {
      const retrievalContext: RetrievalContextItem[] = hits.slice(0, 5).map((h) => ({
        id: h.id,
        title: h.title,
        caseNumber: h.caseNumber,
        entityType: h.entityType,
        snippet: h.highlightSnippet || h.content || h.title,
        sha256Hash: h.sha256Hash,
        versionNumber: h.versionNumber
      }));

      const synthesis = await generateRetrievalSummary(query, retrievalContext);
      aiSummary = synthesis.summary;
      aiModel = synthesis.model;
      aiLatencyMs = synthesis.latencyMs;
    }

    return {
      total: totalHits,
      hits,
      aiSummary,
      aiModel,
      aiLatencyMs
    };
  } catch (err: any) {
    console.warn("[Elasticsearch] ES search unavailable or index empty, using DB scope fallback:", err.message);
  }

  // 4. Resilient Fallback: If Elasticsearch has not been indexed yet, query Postgres directly within strict scope
  try {
    const caseFilter: any = scope.isSuperAdmin
      ? {}
      : scope.adminOrganizationIds.length > 0
        ? {
            OR: [
              { organizationId: { in: scope.adminOrganizationIds } },
              ...(scope.allowedCaseIds.length > 0
                ? [{ id: { in: scope.allowedCaseIds } }]
                : [])
            ]
          }
        : { id: { in: scope.allowedCaseIds } };

    const qLower = query.toLowerCase().trim();

    // Fetch permitted cases
    const permittedCases: Array<{ id: string; caseNumber: string; organizationId: string }> =
      await prisma.case.findMany({
        where: caseFilter,
        select: { id: true, caseNumber: true, organizationId: true }
      });

    const permittedCaseIds = permittedCases.map((c) => c.id);
    const caseMap = new Map(permittedCases.map((c) => [c.id, c.caseNumber]));
    const caseOrgMap = new Map(permittedCases.map((c) => [c.id, c.organizationId]));

    const fallbackHits: SearchHitItem[] = [];

    // Search Documents
    if (entityType === "ALL" || entityType === "DOCUMENT") {
      const docs = await prisma.document.findMany({
        where: {
          caseId: { in: permittedCaseIds },
          OR: qLower
            ? [
                { title: { contains: qLower, mode: "insensitive" } },
                { description: { contains: qLower, mode: "insensitive" } },
                { documentType: { contains: qLower, mode: "insensitive" } }
              ]
            : undefined
        },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
            include: {
              uploadedBy: { select: { name: true } }
            }
          }
        },
        take: limit
      });

      for (const d of docs) {
        const v = d.versions[0];
        fallbackHits.push({
          id: d.id,
          entityType: "DOCUMENT",
          title: d.title,
          content: d.description || "",
          caseId: d.caseId,
          caseNumber: caseMap.get(d.caseId) || "CASE-UNKNOWN",
          organizationId: caseOrgMap.get(d.caseId) || "",
          documentType: d.documentType || undefined,
          versionNumber: v?.versionNumber || 1,
          sha256Hash: v?.sha256Hash || undefined,
          score: 1.0,
          highlightSnippet: d.description || d.title,
          uploadedBy: v?.uploadedBy?.name || "Officer",
          createdAt: d.createdAt.toISOString()
        });
      }
    }

    // Search Evidence
    if (entityType === "ALL" || entityType === "EVIDENCE") {
      const evidences = await prisma.evidence.findMany({
        where: {
          caseId: { in: permittedCaseIds },
          OR: qLower
            ? [
                { title: { contains: qLower, mode: "insensitive" } },
                { description: { contains: qLower, mode: "insensitive" } },
                { evidenceNumber: { contains: qLower, mode: "insensitive" } }
              ]
            : undefined
        },
        include: {
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
        },
        take: limit
      });

      for (const ev of evidences) {
        fallbackHits.push({
          id: ev.id,
          entityType: "EVIDENCE",
          title: ev.title,
          content: ev.description || "",
          caseId: ev.caseId,
          caseNumber: caseMap.get(ev.caseId) || "CASE-UNKNOWN",
          organizationId: caseOrgMap.get(ev.caseId) || "",
          serialNumber: ev.evidenceNumber || undefined,
          evidenceType: "EXHIBIT",
          sha256Hash: ev.documentVersion?.sha256Hash || undefined,
          score: 1.0,
          highlightSnippet: ev.description || `Evidence ID: ${ev.evidenceNumber}`,
          uploadedBy: ev.currentCustodian?.name || "Custodian",
          createdAt: ev.createdAt.toISOString()
        });
      }
    }

    let aiSummary: string | undefined;
    let aiModel: string | undefined;
    let aiLatencyMs: number | undefined;

    if (useAiSynthesis && fallbackHits.length > 0 && query.trim()) {
      const retrievalContext: RetrievalContextItem[] = fallbackHits.slice(0, 5).map((h) => ({
        id: h.id,
        title: h.title,
        caseNumber: h.caseNumber,
        entityType: h.entityType,
        snippet: h.highlightSnippet || h.content || h.title,
        sha256Hash: h.sha256Hash,
        versionNumber: h.versionNumber
      }));

      const synthesis = await generateRetrievalSummary(query, retrievalContext);
      aiSummary = synthesis.summary;
      aiModel = synthesis.model;
      aiLatencyMs = synthesis.latencyMs;
    }

    return {
      total: fallbackHits.length,
      hits: fallbackHits,
      aiSummary,
      aiModel,
      aiLatencyMs
    };
  } catch (dbErr: any) {
    console.error("[SearchService] Fallback DB query failed:", dbErr.message);
    return {
      total: 0,
      hits: []
    };
  }
}
