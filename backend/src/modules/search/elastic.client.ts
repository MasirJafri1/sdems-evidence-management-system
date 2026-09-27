import { Client as OpenSearchClient } from "@opensearch-project/opensearch";
import { env } from "../../config/env";

function createSearchClient(): OpenSearchClient {
  const targetUrl = env.OPENSEARCH_URL || env.ELASTICSEARCH_URL || "http://localhost:9200";
  const auth = (env.OPENSEARCH_USERNAME && env.OPENSEARCH_PASSWORD)
    ? { username: env.OPENSEARCH_USERNAME, password: env.OPENSEARCH_PASSWORD }
    : undefined;

  console.log(`[SearchClient] Initializing OpenSearch client for node ${targetUrl}`);
  return new OpenSearchClient({
    node: targetUrl,
    auth,
    ssl: { rejectUnauthorized: false }
  });
}

export const esClient: OpenSearchClient = createSearchClient();
export const isOpenSearch = true;

export const SDEMS_SEARCH_INDEX = "sdems_search_index";
export const SDEMS_VECTOR_DIMENSION = 4096;

interface InitResult {
  connected: boolean;
  indexCreated: boolean;
  error?: string;
}

let initPromise: Promise<InitResult> | null = null;

/**
 * Ensures OpenSearch client and index are initialized cleanly and idempotently.
 * Thread-safe for serverless/Vercel environments. Safe to await before any search/indexing operation.
 */
export async function ensureOpenSearchInitialized(forceRecreate = false): Promise<InitResult> {
  if (initPromise && !forceRecreate) {
    return initPromise;
  }

  initPromise = (async (): Promise<InitResult> => {
    try {
      const pingRes = await esClient.ping().then((res: any) => res?.body ?? res).catch(() => false);
      if (!pingRes) {
        console.warn("[OpenSearch] Unable to ping search cluster. Operating in DB fallback mode.");
        initPromise = null;
        return { connected: false, indexCreated: false, error: "Ping failed" };
      }

      const existsResponse = await esClient.indices.exists({ index: SDEMS_SEARCH_INDEX });
      const indexExists = Boolean(existsResponse?.body ?? existsResponse);

      if (indexExists && forceRecreate) {
        console.log(`[OpenSearch] forceRecreate requested. Deleting existing index "${SDEMS_SEARCH_INDEX}"...`);
        await esClient.indices.delete({ index: SDEMS_SEARCH_INDEX }).catch(() => {});
      }

      const checkAgainResponse = await esClient.indices.exists({ index: SDEMS_SEARCH_INDEX });
      const checkExistsAgain = Boolean(checkAgainResponse?.body ?? checkAgainResponse);

      if (!checkExistsAgain) {
        const indexSettings: any = {
          "index.knn": true,
          analysis: {
            analyzer: {
              ngram_analyzer: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase", "edge_ngram_filter"]
              }
            },
            filter: {
              edge_ngram_filter: {
                type: "edge_ngram",
                min_gram: 2,
                max_gram: 20
              }
            }
          }
        };

        const indexMappings: any = {
          properties: {
            id: { type: "keyword" },
            entityType: { type: "keyword" },
            title: {
              type: "text",
              analyzer: "standard",
              fields: {
                keyword: { type: "keyword" },
                ngram: { type: "text", analyzer: "ngram_analyzer" }
              }
            },
            content: { type: "text", analyzer: "standard" },
            summary: { type: "text", analyzer: "standard" },
            caseId: { type: "keyword" },
            caseNumber: {
              type: "keyword",
              fields: { text: { type: "text", analyzer: "standard" } }
            },
            organizationId: { type: "keyword" },
            allowedUserIds: { type: "keyword" },
            classification: { type: "keyword" },
            serialNumber: {
              type: "keyword",
              fields: { text: { type: "text", analyzer: "standard" } }
            },
            evidenceType: { type: "keyword" },
            documentType: { type: "keyword" },
            versionNumber: { type: "integer" },
            sha256Hash: {
              type: "keyword",
              fields: { text: { type: "text", analyzer: "standard" } }
            },
            blockchainAnchorId: { type: "keyword" },
            tags: { type: "keyword" },
            status: { type: "keyword" },
            uploadedBy: { type: "text" },
            createdAt: { type: "date" },
            embedding: { type: "knn_vector", dimension: SDEMS_VECTOR_DIMENSION }
          }
        };

        await esClient.indices.create({
          index: SDEMS_SEARCH_INDEX,
          body: { settings: indexSettings, mappings: indexMappings }
        });

        console.log(`[OpenSearch] Index "${SDEMS_SEARCH_INDEX}" successfully created and configured on OpenSearch.`);
        return { connected: true, indexCreated: true };
      }

      return { connected: true, indexCreated: false };
    } catch (err: any) {
      console.warn("[OpenSearch] Initialization error:", err.message);
      initPromise = null;
      return { connected: false, indexCreated: false, error: err.message };
    }
  })();

  return initPromise;
}

// Backward compatibility alias
export const initElasticsearch = ensureOpenSearchInitialized;
