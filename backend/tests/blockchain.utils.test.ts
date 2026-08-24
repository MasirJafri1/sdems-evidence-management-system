import {
  normalizeSha256,
  hashIdentifier,
  computeAnchorId
} from "../src/modules/blockchain/blockchain.utils";

describe("Blockchain utilities", () => {
  test("should normalize valid SHA-256 hash", () => {
    const hash = "A".repeat(64);
    const result = normalizeSha256(hash);
    expect(result).toBe(`0x${"a".repeat(64)}`);
  });

  test("should reject invalid SHA-256 hash", () => {
    expect(() => normalizeSha256("invalid")).toThrow(
      "Invalid SHA-256 hash"
    );
  });

  test("should reject short SHA-256 hash", () => {
    expect(() => normalizeSha256("a".repeat(63))).toThrow();
  });

  test("should produce deterministic identifier hash", () => {
    const first = hashIdentifier("DOC-123");
    const second = hashIdentifier("DOC-123");
    expect(first).toBe(second);
  });

  test("different identifiers should produce different hashes", () => {
    const first = hashIdentifier("DOC-123");
    const second = hashIdentifier("DOC-124");
    expect(first).not.toBe(second);
  });

  test("anchor ID should be deterministic", () => {
    const first = computeAnchorId("CASE-001", "DOC-001", 1);
    const second = computeAnchorId("CASE-001", "DOC-001", 1);
    expect(first).toBe(second);
  });

  test("different document versions should have different anchor IDs", () => {
    const version1 = computeAnchorId("CASE-001", "DOC-001", 1);
    const version2 = computeAnchorId("CASE-001", "DOC-001", 2);
    expect(version1).not.toBe(version2);
  });
});
