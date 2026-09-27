import { esClient, SDEMS_SEARCH_INDEX, ensureOpenSearchInitialized } from "./elastic.client";
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
 * Indexes or updates a document/evidence entity in OpenSearch.
 * Rethrows any errors so indexing failures are visible to callers.
 */
export async function indexEntityInElasticsearch(payload: IndexDocumentPayload): Promise<void> {
  const init = await ensureOpenSearchInitialized();
  if (!init.connected) {
    throw new Error(`OpenSearch cluster unavailable for indexing: ${init.error || "Ping failed"}`);
  }

  const textToEmbed = `${payload.title} ${payload.content || ""} ${payload.summary || ""} ${payload.serialNumber || ""} ${payload.evidenceType || ""}`.trim();
  
  // Generate embedding (returns number[] | null)
  const embedding = await generateEmbedding(textToEmbed);

  const docData: any = {
    ...payload,
    createdAt: payload.createdAt ? new Date(payload.createdAt).toISOString() : new Date().toISOString()
  };

  if (embedding && embedding.length > 0) {
    docData.embedding = embedding;
  }

  try {
    await esClient.index({
      index: SDEMS_SEARCH_INDEX,
      id: payload.id,
      body: docData,
      refresh: "wait_for"
    });

    console.log(`[OpenSearch] Indexed ${payload.entityType} "${payload.title}" (${payload.id}) under Case "${payload.caseNumber}". Chars=${payload.content?.length || 0}`);
  } catch (err: any) {
    console.error(`[OpenSearch] Indexing failed for ${payload.entityType} ID="${payload.id}" in index="${SDEMS_SEARCH_INDEX}":`, err);
    throw err;
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

export interface ScopedSearchResult {
  total: number;
  hits: SearchHitItem[];
  searchEngine: "opensearch" | "db_fallback";
  aiSummary?: string;
  aiModel?: string;
  aiLatencyMs?: number;
}

/**
 * Executes a scoped hybrid search (BM25 + Semantic Vector + Strict ABAC Scope Filtering).
 * Guaranteed Zero Data Leakage: Documents outside the user's permitted case/org are excluded at query time.
 */
export async function executeScopedSearch(
  options: SearchQueryOptions,
  scope: UserSearchScope
): Promise<ScopedSearchResult> {
  const { query, entityType = "ALL", page = 1, limit = 20, useAiSynthesis = false } = options;
  const from = (page - 1) * limit;

  // 1. Build Strict Security Filters (ABAC)
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
        return { total: 0, hits: [], searchEngine: "opensearch" };
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

  // Ensure OpenSearch initialized
  const init = await ensureOpenSearchInitialized();

  if (init.connected) {
    try {
      const qTrimmed = query.trim();
      let esQuery: any;

      if (!qTrimmed) {
        // Empty query -> Match all within authorized scope
        esQuery = {
          bool: {
            must: [{ match_all: {} }],
            filter: mustFilters
          }
        };
      } else {
        // Generate embedding vector if service is available
        const queryEmbedding = await generateEmbedding(qTrimmed);

        const shouldClauses: any[] = [
          {
            multi_match: {
              query: qTrimmed,
              fields: [
                "title^4",
                "content^3",
                "summary^2",
                "serialNumber^5",
                "caseNumber^4",
                "sha256Hash^5",
                "documentType^2",
                "evidenceType^2",
                "tags^2"
              ],
              type: "best_fields",
              operator: "or"
            }
          },
          {
            match_phrase: {
              content: {
                query: qTrimmed,
                boost: 4
              }
            }
          },
          {
            term: {
              serialNumber: {
                value: qTrimmed,
                boost: 6
              }
            }
          },
          {
            term: {
              sha256Hash: {
                value: qTrimmed,
                boost: 6
              }
            }
          }
        ];

        // Add kNN vector clause for OpenSearch if query embedding is available
        if (queryEmbedding && queryEmbedding.length > 0) {
          shouldClauses.push({
            knn: {
              embedding: {
                vector: queryEmbedding,
                k: 10
              }
            }
          });
        }

        esQuery = {
          bool: {
            must: [
              {
                bool: {
                  should: shouldClauses,
                  minimum_should_match: 1
                }
              }
            ],
            filter: mustFilters
          }
        };
      }

      const searchRequestBody: any = {
        from,
        size: limit,
        query: esQuery,
        highlight: {
          require_field_match: false,
          fields: {
            title: { number_of_fragments: 0 },
            content: {
              fragment_size: 180,
              number_of_fragments: 3,
              no_match_size: 180
            },
            summary: { number_of_fragments: 0 },
            serialNumber: { number_of_fragments: 0 }
          },
          pre_tags: ["<mark>"],
          post_tags: ["</mark>"]
        }
      };

      const rawResponse: any = await esClient.search({
        index: SDEMS_SEARCH_INDEX,
        body: searchRequestBody
      });

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

      // Optional AI Summary via Groq
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
        searchEngine: "opensearch",
        aiSummary,
        aiModel,
        aiLatencyMs
      };
    } catch (err: any) {
      console.warn("[OpenSearch] Query execution failed. Falling back to DB search:", err.message);
    }
  }

  // DB Resilient Fallback
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

    const permittedCases = await prisma.case.findMany({
      where: caseFilter,
      select: { id: true, caseNumber: true, organizationId: true }
    });

    const permittedCaseIds = permittedCases.map((c) => c.id);
    const caseMap = new Map(permittedCases.map((c) => [c.id, c.caseNumber]));
    const caseOrgMap = new Map(permittedCases.map((c) => [c.id, c.organizationId]));

    const fallbackHits: SearchHitItem[] = [];

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

    return {
      total: fallbackHits.length,
      hits: fallbackHits,
      searchEngine: "db_fallback"
    };
  } catch (dbErr: any) {
    console.error("[SearchService] Fallback DB query failed:", dbErr.message);
    return {
      total: 0,
      hits: [],
      searchEngine: "db_fallback"
    };
  }
}
