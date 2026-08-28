import crypto from "crypto";

export interface CustodyHashInput {
  evidenceId: string;
  sequence: number;
  fromUserId: string;
  toUserId: string;
  reason: string;
  transferId: string;
  createdAt: Date;
  previousEventHash: string | null;
}

export function createCustodyEventHash(input: CustodyHashInput): string {
  const payload = [
    input.evidenceId,
    String(input.sequence),
    input.fromUserId,
    input.toUserId,
    input.reason,
    input.transferId,
    new Date(input.createdAt).toISOString(),
    input.previousEventHash ?? ""
  ].join("|");

  return crypto
    .createHash("sha256")
    .update(payload, "utf8")
    .digest("hex");
}
