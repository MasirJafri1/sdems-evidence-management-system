import { calculateSha256 } from "../src/utils/hash";

describe("SHA-256", () => {
  test("should generate deterministic hash", () => {
    const input = Buffer.from("hello world");
    const hash1 = calculateSha256(input);
    const hash2 = calculateSha256(input);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  test("different content should produce different hashes", () => {
    const hash1 = calculateSha256(Buffer.from("hello"));
    const hash2 = calculateSha256(Buffer.from("hello!"));

    expect(hash1).not.toBe(hash2);
  });

  test("single byte modification changes hash", () => {
    const original = calculateSha256(Buffer.from("FIR DOCUMENT"));
    const modified = calculateSha256(Buffer.from("FIR DOCUMENX"));

    expect(original).not.toBe(modified);
  });
});
