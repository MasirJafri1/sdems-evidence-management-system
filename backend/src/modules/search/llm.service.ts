import { Groq } from "groq-sdk";
import { env } from "../../config/env";

let groqClientInstance: Groq | null = null;

function getGroqClient(): Groq | null {
  if (!env.GROQ_API_KEY || env.GROQ_API_KEY.trim() === "") {
    return null;
  }
  if (!groqClientInstance) {
    groqClientInstance = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return groqClientInstance;
}

export interface RetrievalContextItem {
  id: string;
  title: string;
  caseNumber: string;
  entityType: string;
  snippet: string;
  sha256Hash?: string;
  versionNumber?: number;
}

/**
 * Groq LLM Retrieval Synthesis Service
 * Accepts user's natural language question + scope-sanitized documents from Elasticsearch.
 * Generates an executive, court-admissible forensic synthesis citing only authorized evidence.
 */
export async function generateRetrievalSummary(
  userQuery: string,
  contextItems: RetrievalContextItem[]
): Promise<{
  summary: string;
  model: string;
  citedDocumentIds: string[];
  latencyMs: number;
}> {
  const startTime = Date.now();
  const groq = getGroqClient();
  const model = env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!groq || contextItems.length === 0) {
    return {
      summary:
        contextItems.length === 0
          ? "No documents or evidence matched your scope-filtered query."
          : `Found ${contextItems.length} matching item(s) in your authorized case repository: ${contextItems.map((c) => `${c.title} (${c.caseNumber})`).join(", ")}. Configure GROQ_API_KEY in backend/.env for AI synthesis.`,
      model: "local-fallback",
      citedDocumentIds: contextItems.map((c) => c.id),
      latencyMs: Date.now() - startTime
    };
  }

  const contextFormatted = contextItems
    .map(
      (item, idx) =>
        `[Document #${idx + 1}] ID: ${item.id} | Case: ${item.caseNumber} | Type: ${item.entityType} | Title: ${item.title}\nContent / Excerpt: ${item.snippet}\nFingerprint: ${item.sha256Hash || "N/A"}`
    )
    .join("\n\n---\n\n");

  const systemPrompt = `You are the AI Forensic Intelligence Analyst for SDEMS (Secure Digital Document & Evidence Management System).
Your task is to answer the officer's query strictly and solely based on the provided, cryptographically verified evidence excerpts below.

CRITICAL RULES:
1. Ground every claim in the provided evidence. Cite references like [Doc #1] or [Case: CASE-XXX].
2. Never invent or assume facts outside the provided excerpts.
3. If the evidence is insufficient to answer the query fully, state clearly what is known and what is missing.
4. Maintain a formal, neutral, forensic tone suitable for legal and investigative reporting.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Evidence Excerpts:\n${contextFormatted}\n\nOfficer Question: "${userQuery}"\n\nPlease provide a clear, forensic synthesis answering the question based on the records above.`
        }
      ],
      model,
      temperature: 0.2,
      max_tokens: 1024
    });

    const summary =
      chatCompletion.choices[0]?.message?.content ||
      "Unable to generate forensic summary from Groq.";

    return {
      summary,
      model,
      citedDocumentIds: contextItems.map((c) => c.id),
      latencyMs: Date.now() - startTime
    };
  } catch (err: any) {
    console.error("[GroqService] Error invoking Groq API:", err.message);
    return {
      summary: `AI retrieval synthesis error (${err.message}). Retrieved ${contextItems.length} matching document(s).`,
      model,
      citedDocumentIds: contextItems.map((c) => c.id),
      latencyMs: Date.now() - startTime
    };
  }
}
