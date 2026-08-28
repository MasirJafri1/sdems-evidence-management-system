import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { evidenceRegistryAbi } from "./evidence-registry.abi";
import {
  hashIdentifier,
  normalizeSha256,
  computeAnchorId,
  computeCustodyAnchorId
} from "./blockchain.utils";

const provider = new JsonRpcProvider(env.BLOCKCHAIN_RPC_URL);

const wallet = new Wallet(env.BLOCKCHAIN_PRIVATE_KEY, provider);

const registry = new Contract(
  env.BLOCKCHAIN_CONTRACT_ADDRESS,
  evidenceRegistryAbi,
  wallet
);

const registryReader = new Contract(
  env.BLOCKCHAIN_CONTRACT_ADDRESS,
  evidenceRegistryAbi,
  provider
);

export interface AnchorInput {
  documentVersionId: string;
  caseId: string;
  documentId: string;
  versionNumber: number;
  sha256Hash: string;
}

export interface AnchorResult {
  anchorId: string;
  transactionHash: string;
  blockNumber: number;
  chainId: number;
  contractAddress: string;
  contentHash: string;
  status: "CONFIRMED";
}

export async function anchorDocumentVersion(
  input: AnchorInput
): Promise<AnchorResult> {
  const contentHash = normalizeSha256(input.sha256Hash);

  const caseIdHash = hashIdentifier(input.caseId);

  const documentIdHash = hashIdentifier(input.documentId);

  const anchorId = computeAnchorId(
    input.caseId,
    input.documentId,
    input.versionNumber
  );

  const network = await provider.getNetwork();

  const chainId = Number(network.chainId);

  /*
   * Create/update the operational
   * blockchain anchor record first.
   */
  await prisma.blockchainAnchor.upsert({
    where: {
      documentVersionId: input.documentVersionId
    },

    create: {
      documentVersionId: input.documentVersionId,

      chainId: BigInt(chainId),

      contractAddress: env.BLOCKCHAIN_CONTRACT_ADDRESS,

      anchorId,

      caseIdHash,

      documentIdHash,

      contentHash,

      versionNumber: input.versionNumber,

      status: "PENDING"
    },

    update: {
      status: "PENDING",

      errorMessage: null
    }
  });

  try {
    /*
     * First check whether this anchor
     * already exists on-chain.
     *
     * This protects us from duplicate
     * transactions after a retry.
     */
    const alreadyExists = await registryReader.exists(anchorId);

    if (alreadyExists) {
      const events = await registryReader.queryFilter(
        registryReader.filters.EvidenceAnchored(anchorId)
      );

      const latestEvent = events[events.length - 1];

      let transactionHash: string | null = null;

      let blockNumber: number | null = null;

      if (latestEvent && "transactionHash" in latestEvent) {
        transactionHash = latestEvent.transactionHash;

        blockNumber = latestEvent.blockNumber;
      }

      await prisma.blockchainAnchor.update({
        where: {
          documentVersionId: input.documentVersionId
        },

        data: {
          status: "CONFIRMED",

          transactionHash,

          blockNumber: blockNumber === null ? null : BigInt(blockNumber),

          anchoredAt: new Date(),

          errorMessage: null
        }
      });

      return {
        anchorId,

        transactionHash: transactionHash ?? "already-anchored",

        blockNumber: blockNumber ?? 0,

        chainId,

        contractAddress: env.BLOCKCHAIN_CONTRACT_ADDRESS,

        contentHash,

        status: "CONFIRMED"
      };
    }

    /*
     * Write the anchor to blockchain.
     */
    const tx = await registry.anchorEvidence(
      caseIdHash,
      documentIdHash,
      contentHash,
      input.versionNumber
    );

    /*
     * Wait until the transaction
     * is mined.
     */
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Blockchain transaction did not return a receipt");
    }

    const transactionHash = receipt.hash;

    const blockNumber = receipt.blockNumber;

    await prisma.blockchainAnchor.update({
      where: {
        documentVersionId: input.documentVersionId
      },

      data: {
        status: "CONFIRMED",

        transactionHash,

        blockNumber: BigInt(blockNumber),

        anchoredAt: new Date(),

        errorMessage: null
      }
    });

    return {
      anchorId,

      transactionHash,

      blockNumber,

      chainId,

      contractAddress: env.BLOCKCHAIN_CONTRACT_ADDRESS,

      contentHash,

      status: "CONFIRMED"
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown blockchain error";

    await prisma.blockchainAnchor.update({
      where: {
        documentVersionId: input.documentVersionId
      },

      data: {
        status: "FAILED",

        errorMessage: message
      }
    });

    throw error;
  }
}

export interface CustodyAnchorInput {
  evidenceId: string;
  caseId: string;
  transferId: string;
  sequence: number;
  eventHash: string;
}

export interface CustodyAnchorResult {
  anchorId: string;
  transactionHash: string;
  blockNumber: number;
  chainId: number;
  contractAddress: string;
  eventHash: string;
  sequence: number;
  status: "CONFIRMED";
}

export async function anchorCustodyEvent(
  input: CustodyAnchorInput
): Promise<CustodyAnchorResult> {
  const eventHash = normalizeSha256(input.eventHash);
  const caseIdHash = hashIdentifier(input.caseId);
  const evidenceIdHash = hashIdentifier(input.evidenceId);
  const transferIdHash = hashIdentifier(input.transferId);

  const anchorId = computeCustodyAnchorId(
    input.caseId,
    input.evidenceId,
    input.transferId,
    input.sequence
  );

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  const alreadyExists = await registryReader.custodyAnchorExistsOnChain(
    anchorId
  );

  if (alreadyExists) {
    const events = await registryReader.queryFilter(
      registryReader.filters.CustodyEventAnchored(anchorId)
    );

    const latestEvent = events[events.length - 1];

    let transactionHash = "already-anchored";
    let blockNumber = 0;

    if (latestEvent && "transactionHash" in latestEvent) {
      transactionHash = latestEvent.transactionHash;
      blockNumber = latestEvent.blockNumber;
    }

    return {
      anchorId,
      transactionHash,
      blockNumber,
      chainId,
      contractAddress: env.BLOCKCHAIN_CONTRACT_ADDRESS,
      eventHash,
      sequence: input.sequence,
      status: "CONFIRMED"
    };
  }

  const tx = await registry.anchorCustodyEvent(
    caseIdHash,
    evidenceIdHash,
    transferIdHash,
    eventHash,
    input.sequence
  );

  const receipt = await tx.wait();

  if (!receipt) {
    throw new Error("Blockchain transaction did not return a receipt");
  }

  return {
    anchorId,
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    chainId,
    contractAddress: env.BLOCKCHAIN_CONTRACT_ADDRESS,
    eventHash,
    sequence: input.sequence,
    status: "CONFIRMED"
  };
}

export async function verifyDocumentVersion(documentVersionId: string) {
  const version = await prisma.documentVersion.findUnique({
    where: {
      id: documentVersionId
    },

    include: {
      document: true,

      blockchainAnchor: true
    }
  });

  if (!version) {
    throw new Error("Document version not found");
  }

  if (!version.blockchainAnchor) {
    return {
      verified: false,

      reason: "No blockchain anchor exists"
    };
  }

  const contentHash = normalizeSha256(version.sha256Hash);

  const verified = await registryReader.verifyAnchor(
    version.blockchainAnchor.anchorId,

    contentHash
  );

  return {
    verified,

    documentVersionId,

    localHash: version.sha256Hash,

    blockchainHash: version.blockchainAnchor.contentHash,

    anchorId: version.blockchainAnchor.anchorId,

    transactionHash: version.blockchainAnchor.transactionHash,

    blockNumber: version.blockchainAnchor.blockNumber?.toString(),

    contractAddress: version.blockchainAnchor.contractAddress,

    status: version.blockchainAnchor.status
  };
}

export async function getBlockchainAnchor(documentVersionId: string) {
  const anchor = await prisma.blockchainAnchor.findUnique({
    where: {
      documentVersionId
    }
  });

  if (!anchor) {
    return null;
  }

  return {
    ...anchor,

    chainId: anchor.chainId.toString(),

    blockNumber: anchor.blockNumber?.toString()
  };
}

export async function getBlockchainStatus() {
  const network = await provider.getNetwork();

  const blockNumber = await provider.getBlockNumber();

  const walletAddress = await wallet.getAddress();

  return {
    connected: true,

    chainId: network.chainId.toString(),

    blockNumber,

    walletAddress,

    contractAddress: env.BLOCKCHAIN_CONTRACT_ADDRESS
  };
}
