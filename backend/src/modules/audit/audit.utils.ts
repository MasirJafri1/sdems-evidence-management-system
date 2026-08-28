import crypto from "crypto";

function canonicalizeJson(obj: unknown): string {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalizeJson).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const sortedObjParts = keys.map(
    (key) =>
      `${JSON.stringify(key)}:${canonicalizeJson((obj as Record<string, unknown>)[key])}`
  );
  return "{" + sortedObjParts.join(",") + "}";
}

export function createAuditHash(data: {
  caseId: string;
  actorId: string | null;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  sequence: number;
  previousHash: string | null;
  createdAt: Date;
}): string {
  const payload = [
    data.caseId,
    data.actorId || "",
    data.eventType,
    data.entityType || "",
    data.entityId || "",
    canonicalizeJson(data.metadata ?? null),
    String(data.sequence),
    data.previousHash || "",
    new Date(data.createdAt).toISOString()
  ].join("|");

  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

export function verifyAuditEventHash(event: {
  caseId: string;
  actorId: string | null;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  sequence: number;
  previousHash: string | null;
  eventHash: string;
  createdAt: Date;
}): boolean {
  const expectedHash = createAuditHash({
    caseId: event.caseId,
    actorId: event.actorId,
    eventType: event.eventType,
    entityType: event.entityType,
    entityId: event.entityId,
    metadata: event.metadata,
    sequence: event.sequence,
    previousHash: event.previousHash,
    createdAt: event.createdAt
  });

  return expectedHash === event.eventHash;
}
