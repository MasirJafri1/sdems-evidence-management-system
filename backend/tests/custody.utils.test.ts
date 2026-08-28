import {
  createCustodyEventHash
} from "../src/modules/evidence/custody.utils";

describe("Custody event hash utilities", () => {
  const createdAt = new Date("2026-08-28T12:00:00.000Z");

  const baseInput = {
    evidenceId: "evidence-1",
    sequence: 1,
    fromUserId: "user-1",
    toUserId: "user-2",
    reason: "Transferring physical drive",
    transferId: "transfer-1",
    createdAt,
    previousEventHash: null
  };

  test("creates deterministic custody event hash", () => {
    const hash1 = createCustodyEventHash(baseInput);
    const hash2 = createCustodyEventHash(baseInput);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  test("different sequence produces different hash", () => {
    const hash1 = createCustodyEventHash(baseInput);
    const hash2 = createCustodyEventHash({
      ...baseInput,
      sequence: 2
    });

    expect(hash1).not.toBe(hash2);
  });

  test("different recipient produces different hash", () => {
    const hash1 = createCustodyEventHash(baseInput);
    const hash2 = createCustodyEventHash({
      ...baseInput,
      toUserId: "user-3"
    });

    expect(hash1).not.toBe(hash2);
  });

  test("different previous hash produces different hash", () => {
    const hash1 = createCustodyEventHash(baseInput);
    const hash2 = createCustodyEventHash({
      ...baseInput,
      previousEventHash: "prev-hash-xyz"
    });

    expect(hash1).not.toBe(hash2);
  });
});
