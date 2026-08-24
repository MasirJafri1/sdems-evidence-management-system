export const evidenceRegistryAbi = [
  "function computeAnchorId(bytes32 caseIdHash, bytes32 documentIdHash, uint64 version) view returns (bytes32)",
  "function anchorEvidence(bytes32 caseIdHash, bytes32 documentIdHash, bytes32 contentHash, uint64 version) returns (bytes32)",
  "function verifyAnchor(bytes32 anchorId, bytes32 contentHash) view returns (bool)",
  "function exists(bytes32 anchorId) view returns (bool)",
  "function getAnchor(bytes32 anchorId) view returns (tuple(bytes32 caseIdHash, bytes32 documentIdHash, bytes32 contentHash, uint64 version, uint64 anchoredAt, address anchoredBy) anchor, bool exists)",
  "event EvidenceAnchored(bytes32 indexed anchorId, bytes32 indexed caseIdHash, bytes32 indexed documentIdHash, bytes32 contentHash, uint64 version, uint64 anchoredAt, address anchoredBy)"
] as const;
