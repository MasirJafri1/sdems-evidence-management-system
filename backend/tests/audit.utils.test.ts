import {
  createAuditHash,
  verifyAuditEventHash
} from "../src/modules/audit/audit.utils";

describe("Audit hash utilities", () => {
  const createdAt = new Date("2026-08-28T10:00:00.000Z");

  const baseEvent = {
    caseId: "case-1",
    actorId: "user-1",
    eventType: "DOCUMENT_CREATED",
    entityType: "Document",
    entityId: "document-1",
    metadata: {
      version: 1,
      sha256: "abc123"
    },
    sequence: 1,
    previousHash: null,
    createdAt
  };

  test("creates deterministic hash", () => {
    const hash1 = createAuditHash(baseEvent);
    const hash2 = createAuditHash(baseEvent);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  test("different metadata produces different hash", () => {
    const hash1 = createAuditHash(baseEvent);
    const hash2 = createAuditHash({
      ...baseEvent,
      metadata: {
        version: 2,
        sha256: "abc123"
      }
    });

    expect(hash1).not.toBe(hash2);
  });

  test("different previous hash produces different hash", () => {
    const hash1 = createAuditHash(baseEvent);
    const hash2 = createAuditHash({
      ...baseEvent,
      previousHash: "previous-hash"
    });

    expect(hash1).not.toBe(hash2);
  });

  test("valid event verifies", () => {
    const eventHash = createAuditHash(baseEvent);
    const valid = verifyAuditEventHash({
      ...baseEvent,
      eventHash
    });

    expect(valid).toBe(true);
  });

  test("modified event fails verification", () => {
    const eventHash = createAuditHash(baseEvent);
    const valid = verifyAuditEventHash({
      ...baseEvent,
      eventHash,
      metadata: {
        version: 999,
        sha256: "tampered"
      }
    });

    expect(valid).toBe(false);
  });
});
