import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("EvidenceRegistry Smart Contract", () => {
  let registry: any;
  let admin: any;
  let unauthorizedUser: any;

  const caseIdHash = ethers.id("CASE-001");
  const documentIdHash = ethers.id("DOC-001");
  const contentHash =
    "0x9b1deb4d98f12345678901234567890123456789012345678901234567890123";
  const version = 1;

  beforeEach(async () => {
    [admin, unauthorizedUser] = await ethers.getSigners();
    registry = await ethers.deployContract("EvidenceRegistry", [admin.address]);
    await registry.waitForDeployment();
  });

  it("should deploy and assign ANCHOR_ROLE to admin", async () => {
    const anchorRole = await registry.ANCHOR_ROLE();
    const hasRole = await registry.hasRole(anchorRole, admin.address);
    expect(hasRole).to.be.true;
  });

  it("should anchor evidence successfully", async () => {
    const anchorId = await registry.computeAnchorId(
      caseIdHash,
      documentIdHash,
      version
    );

    const tx = await registry.anchorEvidence(
      caseIdHash,
      documentIdHash,
      contentHash,
      version
    );
    await tx.wait();

    const exists = await registry.exists(anchorId);
    expect(exists).to.be.true;

    const isVerified = await registry.verifyAnchor(anchorId, contentHash);
    expect(isVerified).to.be.true;
  });

  it("should reject duplicate anchor evidence", async () => {
    await registry.anchorEvidence(
      caseIdHash,
      documentIdHash,
      contentHash,
      version
    );

    try {
      await registry.anchorEvidence(
        caseIdHash,
        documentIdHash,
        contentHash,
        version
      );
      expect.fail("Expected transaction to revert on duplicate anchor");
    } catch (error: any) {
      expect(error.message).to.include("AnchorAlreadyExists");
    }
  });

  it("should reject anchoring from unauthorized account", async () => {
    const unauthorizedContract = registry.connect(unauthorizedUser);

    try {
      await unauthorizedContract.anchorEvidence(
        caseIdHash,
        documentIdHash,
        contentHash,
        version
      );
      expect.fail("Expected transaction to revert for unauthorized account");
    } catch (error: any) {
      expect(error.message).to.include("AccessControl");
    }
  });

  it("should anchor a custody event on-chain", async () => {
    const evidenceIdHash = ethers.id("EVD-001");
    const transferIdHash = ethers.id("TRF-001");
    const eventHash =
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const sequence = 1;

    const anchorId = await registry.computeCustodyAnchorId(
      caseIdHash,
      evidenceIdHash,
      transferIdHash,
      sequence
    );

    const tx = await registry.anchorCustodyEvent(
      caseIdHash,
      evidenceIdHash,
      transferIdHash,
      eventHash,
      sequence
    );
    await tx.wait();

    const exists = await registry.custodyAnchorExistsOnChain(anchorId);
    expect(exists).to.be.true;

    const verified = await registry.verifyCustodyAnchor(anchorId, eventHash);
    expect(verified).to.be.true;

    const wrongHash =
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    const verifiedWrong = await registry.verifyCustodyAnchor(anchorId, wrongHash);
    expect(verifiedWrong).to.be.false;
  });
});
