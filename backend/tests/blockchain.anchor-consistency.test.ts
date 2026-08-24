import { solidityPackedKeccak256 } from "ethers";
import {
  hashIdentifier,
  computeAnchorId
} from "../src/modules/blockchain/blockchain.utils";

describe("Blockchain anchor consistency", () => {
  test("backend anchor ID must match Solidity calculation", () => {
    const caseId = "CASE-123";
    const documentId = "DOCUMENT-456";
    const version = 3;

    const backendAnchor = computeAnchorId(caseId, documentId, version);

    const solidityEquivalent = solidityPackedKeccak256(
      ["bytes32", "bytes32", "uint64"],
      [hashIdentifier(caseId), hashIdentifier(documentId), version]
    );

    expect(backendAnchor).toBe(solidityEquivalent);
  });
});
