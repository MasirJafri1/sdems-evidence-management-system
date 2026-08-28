export const evidenceRegistryAbi = [
  // Existing document functions
  "function computeAnchorId(bytes32 caseIdHash, bytes32 documentIdHash, uint64 version) view returns (bytes32)",
  "function anchorEvidence(bytes32 caseIdHash, bytes32 documentIdHash, bytes32 contentHash, uint64 version) returns (bytes32)",
  "function verifyAnchor(bytes32 anchorId, bytes32 contentHash) view returns (bool)",
  "function exists(bytes32 anchorId) view returns (bool)",
  "function getAnchor(bytes32 anchorId) view returns (tuple(bytes32 caseIdHash, bytes32 documentIdHash, bytes32 contentHash, uint64 version, uint64 anchoredAt, address anchoredBy) anchor, bool exists)",

  // New custody functions
  "function computeCustodyAnchorId(bytes32 caseIdHash, bytes32 evidenceIdHash, bytes32 transferIdHash, uint64 sequence) view returns (bytes32)",
  "function anchorCustodyEvent(bytes32 caseIdHash, bytes32 evidenceIdHash, bytes32 transferIdHash, bytes32 eventHash, uint64 sequence) returns (bytes32)",
  "function getCustodyAnchor(bytes32 anchorId) view returns (tuple(bytes32 caseIdHash, bytes32 evidenceIdHash, bytes32 transferIdHash, bytes32 eventHash, uint64 sequence, uint64 anchoredAt, address anchoredBy) anchor, bool exists)",
  "function verifyCustodyAnchor(bytes32 anchorId, bytes32 eventHash) view returns (bool)",
  "function custodyAnchorExistsOnChain(bytes32 anchorId) view returns (bool)",

  // Existing event
  "event EvidenceAnchored(bytes32 indexed anchorId, bytes32 indexed caseIdHash, bytes32 indexed documentIdHash, bytes32 contentHash, uint64 version, uint64 anchoredAt, address anchoredBy)",

  // New event
  "event CustodyEventAnchored(bytes32 indexed anchorId, bytes32 indexed caseIdHash, bytes32 indexed evidenceIdHash, bytes32 transferIdHash, bytes32 eventHash, uint64 sequence, uint64 anchoredAt, address anchoredBy)"
] as const;
