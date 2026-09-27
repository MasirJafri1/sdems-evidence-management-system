import { env } from "../../config/env";
import { SDEMS_VECTOR_DIMENSION } from "./elastic.client";

function normalizeVector(vec: number[]): number[] {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => Number((v / norm).toFixed(6)));
}

/**
 * Generates embeddings via OpenRouter API.
 * Returns normalized vector of exact dimension SDEMS_VECTOR_DIMENSION (1024),
 * or null if embedding service is unconfigured or fails (allowing pure BM25 search fallback).
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = env.OPENROUTER_API_KEY;
  const model = env.OPENROUTER_EMBEDDING_MODEL || "qwen/qwen3-embedding-8b";
  const targetDim = SDEMS_VECTOR_DIMENSION;

  if (!text || text.trim() === "") {
    return null;
  }

  if (!apiKey || apiKey.trim() === "") {
    console.log("[EmbeddingService] OPENROUTER_API_KEY not set. Embedding skipped; falling back to BM25 keyword search.");
    return null;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sdems.internal",
        "X-Title": "SDEMS Evidence Search"
      },
      body: JSON.stringify({
        model,
        input: text.slice(0, 8000)
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.warn(`[EmbeddingService] OpenRouter embedding request failed status ${response.status}: ${errBody}`);
      return null;
    }

    const data: any = await response.json();
    if (data?.data?.[0]?.embedding) {
      const rawVector: number[] = data.data[0].embedding;
      if (rawVector.length === targetDim) {
        return normalizeVector(rawVector);
      }
      console.warn(`[EmbeddingService] Embedding dimension mismatch: model returned ${rawVector.length}, expected ${targetDim}.`);
      return null;
    }

    return null;
  } catch (err: any) {
    console.warn("[EmbeddingService] Error fetching embeddings:", err.message);
    return null;
  }
}
