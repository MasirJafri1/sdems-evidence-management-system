import { env } from "../../config/env";
import { SDEMS_VECTOR_DIMENSION } from "./elastic.client";

/**
 * OpenRouter Embedding Service
 * Produces normalized vectors aligned with Elasticsearch dense_vector(1024 dims).
 */

function normalizeVector(vec: number[]): number[] {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => Number((v / norm).toFixed(6)));
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = env.OPENROUTER_API_KEY;
  const model = env.OPENROUTER_EMBEDDING_MODEL || "qwen/qwen3-embedding-8b";
  const targetDim = SDEMS_VECTOR_DIMENSION;

  if (!apiKey || apiKey.trim() === "") {
    return generateDeterministicVector(text, targetDim);
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
      console.warn(`[EmbeddingService] OpenRouter returned ${response.status}: ${errBody}. Using fallback vector.`);
      return generateDeterministicVector(text, targetDim);
    }

    const data: any = await response.json();
    if (data?.data?.[0]?.embedding) {
      const rawVector: number[] = data.data[0].embedding;
      let adjustedVector: number[];

      if (rawVector.length === targetDim) {
        adjustedVector = rawVector;
      } else if (rawVector.length > targetDim) {
        adjustedVector = rawVector.slice(0, targetDim);
      } else {
        adjustedVector = [...rawVector, ...new Array(targetDim - rawVector.length).fill(0)];
      }

      return normalizeVector(adjustedVector);
    }

    return generateDeterministicVector(text, targetDim);
  } catch (err: any) {
    console.warn("[EmbeddingService] Error calling OpenRouter embeddings:", err.message);
    return generateDeterministicVector(text, targetDim);
  }
}

/**
 * Fallback deterministic normalized vector generator based on text hash
 */
function generateDeterministicVector(text: string, dims: number): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const vec: number[] = new Array(dims);
  let norm = 0;
  for (let i = 0; i < dims; i++) {
    const val = Math.sin(hash + i);
    vec[i] = val;
    norm += val * val;
  }
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => Number((v / norm).toFixed(6)));
}
