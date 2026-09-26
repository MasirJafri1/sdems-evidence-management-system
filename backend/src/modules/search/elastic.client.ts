import { Client as OpenSearchClient } from "@opensearch-project/opensearch";
import { Client as ElasticClient } from "@elastic/elasticsearch";
import { env } from "../../config/env";

function createSearchClient(): any {
  const targetUrl = env.OPENSEARCH_URL || env.ELASTICSEARCH_URL || "http://localhost:9200";
  const auth = (env.OPENSEARCH_USERNAME && env.OPENSEARCH_PASSWORD)
    ? { username: env.OPENSEARCH_USERNAME, password: env.OPENSEARCH_PASSWORD }
    : undefined;

  if (env.OPENSEARCH_URL) {
    console.log(`[SearchClient] Initializing AWS OpenSearch client for ${targetUrl}`);
    return new OpenSearchClient({
      node: targetUrl,
      auth,
      ssl: { rejectUnauthorized: false }
    });
  }

  return new ElasticClient({
    node: targetUrl,
    ...(auth ? { auth } : {})
  });
}

export const esClient: any = createSearchClient();
export const isOpenSearch = Boolean(env.OPENSEARCH_URL);

export const SDEMS_SEARCH_INDEX = "sdems_search_index";
export const SDEMS_VECTOR_DIMENSION = 1024;

export async function initElasticsearch(recreateIfMismatch = false): Promise<{
  connected: boolean;
  indexCreated: boolean;
  error?: string;
}> {
  try {
    const isPingOk = await esClient.ping().then((res: any) => res?.body ?? res).catch(() => false);
    if (!isPingOk) {
      console.warn("[Search] Unable to ping search cluster. Operating in DB fallback mode.");
      return { connected: false, indexCreated: false, error: "Ping failed" };
    }

    const existsResponse = await esClient.indices.exists({ index: SDEMS_SEARCH_INDEX });
    const indexExists = existsResponse?.body ?? existsResponse;

    if (indexExists) {
      try {
        const mappingRes = await esClient.indices.getMapping({ index: SDEMS_SEARCH_INDEX }).then((r: any) => r?.body ?? r);
        const props = mappingRes?.[SDEMS_SEARCH_INDEX]?.mappings?.properties || mappingRes?.mappings?.properties || {};
        const currentType = props.embedding?.type;
        const expectedType = isOpenSearch ? "knn_vector" : "dense_vector";

        if (recreateIfMismatch || (currentType && currentType !== expectedType)) {
          console.log(`[Search] Mismatch detected: mapping.embedding is "${currentType || "missing"}", expected "${expectedType}". Auto-recreating index...`);
          await esClient.indices.delete({ index: SDEMS_SEARCH_INDEX });
        }
      } catch (mapErr: any) {
        if (recreateIfMismatch) {
          await esClient.indices.delete({ index: SDEMS_SEARCH_INDEX }).catch(() => {});
        }
      }
    }

    const checkAgainResponse = await esClient.indices.exists({ index: SDEMS_SEARCH_INDEX });
    const checkExistsAgain = checkAgainResponse?.body ?? checkAgainResponse;

    if (!checkExistsAgain) {
      const isOS = isOpenSearch;
      const indexSettings: any = {
        ...(isOS ? { "index.knn": true } : {}),
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
              ngram: {
                type: "text",
                analyzer: "ngram_analyzer"
              }
            }
          },
          content: { type: "text" },
          summary: { type: "text" },
          caseId: { type: "keyword" },
          caseNumber: { type: "keyword" },
          organizationId: { type: "keyword" },
          allowedUserIds: { type: "keyword" },
          classification: { type: "keyword" },
          serialNumber: { type: "keyword" },
          evidenceType: { type: "keyword" },
          documentType: { type: "keyword" },
          versionNumber: { type: "integer" },
          sha256Hash: { type: "keyword" },
          blockchainAnchorId: { type: "keyword" },
          tags: { type: "keyword" },
          status: { type: "keyword" },
          uploadedBy: { type: "text" },
          createdAt: { type: "date" },
          embedding: isOS
            ? { type: "knn_vector", dimension: SDEMS_VECTOR_DIMENSION }
            : { type: "dense_vector", dims: SDEMS_VECTOR_DIMENSION, index: true, similarity: "cosine" }
        }
      };

      // OpenSearch SDK requires settings/mappings inside body; ES8 uses top-level
      const createPayload: any = isOS
        ? { index: SDEMS_SEARCH_INDEX, body: { settings: indexSettings, mappings: indexMappings } }
        : { index: SDEMS_SEARCH_INDEX, settings: indexSettings, mappings: indexMappings };

      await esClient.indices.create(createPayload);
      console.log(`[Search] Index "${SDEMS_SEARCH_INDEX}" successfully initialized on ${isOS ? "AWS OpenSearch" : "Elasticsearch"}.`);
      return { connected: true, indexCreated: true };
    }

    return { connected: true, indexCreated: false };
  } catch (err: any) {
    console.warn("[Search] Initialization warning:", err.message);
    return { connected: false, indexCreated: false, error: err.message };
  }
}
