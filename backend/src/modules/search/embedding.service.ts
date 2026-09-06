import { env } from "../../config/env";

/**
 * OpenRouter Embedding Service
 * Calls OpenRouter's /api/v1/embeddings endpoint.
 * Supported models include:
 * - sentence-transformers/all-minilm-l6-v2 (384 dimensions)
 * - qwen/qwen3-embedding-8b (1024 dimensions)
 * - openai/text-embedding-3-small (1536 dimensions)
 */

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = env.OPENROUTER_API_KEY;
  const model = env.OPENROUTER_EMBEDDING_MODEL || "sentence-transformers/all-minilm-l6-v2";

  // If no API key is provided, return a deterministic fallback pseudo-embedding
  // so local development without an immediate paid key never crashes
  if (!apiKey || apiKey.trim() === "") {
    console.warn("[EmbeddingService] OPENROUTER_API_KEY not set. Generating deterministic pseudo-vector.");
    return generateDeterministicVector(text, getModelDimension(model));
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
        input: text.slice(0, 8000) // truncate large inputs if needed
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.warn(`[EmbeddingService] OpenRouter returned ${response.status}:`, errBody);
      return generateDeterministicVector(text, getModelDimension(model));
    }

    const data: any = await response.json();
    if (data?.data?.[0]?.embedding) {
      const rawVector: number[] = data.data[0].embedding;
      const targetDim = getModelDimension(model);
      if (rawVector.length === targetDim) {
        return rawVector;
      }
      console.warn(`[EmbeddingService] OpenRouter returned ${rawVector.length} dims, adjusting to mapping ${targetDim} dims.`);
      if (rawVector.length > targetDim) {
        return rawVector.slice(0, targetDim);
      }
      // Pad with zeros if smaller
      return [...rawVector, ...new Array(targetDim - rawVector.length).fill(0)];
    }

    return generateDeterministicVector(text, getModelDimension(model));
  } catch (err: any) {
    console.warn("[EmbeddingService] Error calling OpenRouter embeddings:", err.message);
    return generateDeterministicVector(text, getModelDimension(model));
  }
}

function getModelDimension(model: string): number {
  if (model.includes("minilm")) return 384;
  if (model.includes("qwen") || model.includes("mistral")) return 1024;
  return 1536;
}

/**
 * Fallback deterministic vector generator based on text hash
 * Ensures local testing works without external rate limits
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
