import { id, AbiCoder, keccak256 } from "ethers";

export function normalizeSha256(sha256Hash: string): string {
  const normalized = sha256Hash.trim().toLowerCase().replace(/^0x/, "");

  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new Error("Invalid SHA-256 hash");
  }

  return `0x${normalized}`;
}

export function hashIdentifier(value: string): string {
  return id(value);
}

const abiCoder = AbiCoder.defaultAbiCoder();

/**
 * Computes anchorId matching Solidity EvidenceRegistry:
 * return keccak256(abi.encode(caseIdHash, documentIdHash, version));
 */
export function computeAnchorId(
  caseId: string,
  documentId: string,
  versionNumber: number
): string {
  const caseIdHash = hashIdentifier(caseId);
  const documentIdHash = hashIdentifier(documentId);

  const encoded = abiCoder.encode(
    ["bytes32", "bytes32", "uint64"],
    [caseIdHash, documentIdHash, versionNumber]
  );

  return keccak256(encoded);
}

/**
 * Computes custodyAnchorId matching Solidity EvidenceRegistry:
 * return keccak256(abi.encode(caseIdHash, evidenceIdHash, transferIdHash, sequence));
 */
export function computeCustodyAnchorId(
  caseId: string,
  evidenceId: string,
  transferId: string,
  sequence: number
): string {
  const caseIdHash = hashIdentifier(caseId);
  const evidenceIdHash = hashIdentifier(evidenceId);
  const transferIdHash = hashIdentifier(transferId);

  const encoded = abiCoder.encode(
    ["bytes32", "bytes32", "bytes32", "uint64"],
    [caseIdHash, evidenceIdHash, transferIdHash, sequence]
  );

  return keccak256(encoded);
}
