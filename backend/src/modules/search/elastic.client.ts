import { Client } from "@elastic/elasticsearch";
import { env } from "../../config/env";

export const esClient = new Client({
  node: env.ELASTICSEARCH_URL || "http://localhost:9200"
});

export const SDEMS_SEARCH_INDEX = "sdems_search_index";

const VECTOR_DIMENSION =
  env.OPENROUTER_EMBEDDING_MODEL.includes("minilm")
    ? 384
    : env.OPENROUTER_EMBEDDING_MODEL.includes("qwen") ||
        env.OPENROUTER_EMBEDDING_MODEL.includes("mistral")
      ? 1024
      : 1536;

export async function initElasticsearch(): Promise<{
  connected: boolean;
  indexCreated: boolean;
  error?: string;
}> {
  try {
    const pingOk = await esClient.ping();
    if (!pingOk) {
      return { connected: false, indexCreated: false, error: "Ping failed" };
    }

    const indexExists = await esClient.indices.exists({
      index: SDEMS_SEARCH_INDEX
    });

    if (!indexExists) {
      const createPayload: any = {
        index: SDEMS_SEARCH_INDEX,
        settings: {
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
        },
        mappings: {
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
            embedding: {
              type: "dense_vector",
              dims: VECTOR_DIMENSION,
              index: true,
              similarity: "cosine"
            }
          }
        }
      };

      await esClient.indices.create(createPayload);
      console.log(`[Elasticsearch] Index "${SDEMS_SEARCH_INDEX}" successfully initialized with dense_vector(${VECTOR_DIMENSION} dims).`);
      return { connected: true, indexCreated: true };
    }

    return { connected: true, indexCreated: false };
  } catch (err: any) {
    console.warn("[Elasticsearch] Initialization warning:", err.message);
    return { connected: false, indexCreated: false, error: err.message };
  }
}
