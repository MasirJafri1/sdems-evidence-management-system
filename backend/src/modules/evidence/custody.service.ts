import { prisma } from "../../lib/prisma";
import { createCustodyEventHash } from "./custody.utils";
import { anchorCustodyEvent } from "../blockchain/blockchain.service";

export interface CreateTransferInput {
  evidenceId: string;
  fromUserId: string;
  toUserId: string;
  reason: string;
  initiatedById: string;
}

export async function createCustodyTransfer(input: CreateTransferInput) {
  const evidence = await prisma.evidence.findUnique({
    where: {
      id: input.evidenceId
    }
  });

  if (!evidence) {
    throw new Error("Evidence not found");
  }

  if (evidence.status !== "ACTIVE") {
    throw new Error("Evidence is not available for transfer");
  }

  if (evidence.currentCustodianId !== input.fromUserId) {
    throw new Error("Only the current custodian can initiate a transfer");
  }

  if (input.fromUserId === input.toUserId) {
    throw new Error("Source and recipient must be different");
  }

  const initiator = await prisma.caseParticipant.findUnique({
    where: {
      caseId_userId: {
        caseId: evidence.caseId,
        userId: input.initiatedById
      }
    }
  });

  if (!initiator || initiator.status !== "ACTIVE") {
    throw new Error("Initiator is not an active case participant");
  }

  if (input.initiatedById !== input.fromUserId) {
    throw new Error("Transfer must be initiated by the current custodian");
  }

  const recipient = await prisma.caseParticipant.findUnique({
    where: {
      caseId_userId: {
        caseId: evidence.caseId,
        userId: input.toUserId
      }
    }
  });

  if (!recipient || recipient.status !== "ACTIVE") {
    throw new Error("Recipient is not an active participant of this case");
  }

  const pending = await prisma.custodyTransfer.findFirst({
    where: {
      evidenceId: input.evidenceId,
      status: "PENDING"
    }
  });

  if (pending) {
    throw new Error("Evidence already has a pending custody transfer");
  }

  const transfer = await prisma.$transaction(async (tx) => {
    const created = await tx.custodyTransfer.create({
      data: {
        evidenceId: input.evidenceId,
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        initiatedById: input.initiatedById,
        reason: input.reason
      }
    });

    await tx.evidence.update({
      where: {
        id: input.evidenceId
      },
      data: {
        status: "IN_TRANSFER"
      }
    });

    return created;
  });

  return transfer;
}

export async function acceptCustodyTransfer(
  transferId: string,
  recipientUserId: string
) {
  const transfer = await prisma.custodyTransfer.findUnique({
    where: {
      id: transferId
    },
    include: {
      evidence: true
    }
  });

  if (!transfer) {
    throw new Error("Custody transfer not found");
  }

  if (transfer.status !== "PENDING") {
    throw new Error("Custody transfer is no longer pending");
  }

  if (transfer.toUserId !== recipientUserId) {
    throw new Error("Only the intended recipient can accept this transfer");
  }

  const acceptedAt = new Date();

  /*
   * First determine custody-event sequence.
   */
  const lastEvent = await prisma.custodyEvent.findFirst({
    where: {
      evidenceId: transfer.evidenceId
    },
    orderBy: {
      sequence: "desc"
    }
  });

  const sequence = lastEvent ? lastEvent.sequence + 1 : 1;
  const previousHash = lastEvent ? lastEvent.eventHash : null;

  const eventHash = createCustodyEventHash({
    evidenceId: transfer.evidenceId,
    sequence,
    fromUserId: transfer.fromUserId,
    toUserId: transfer.toUserId,
    reason: transfer.reason,
    transferId: transfer.id,
    createdAt: acceptedAt,
    previousEventHash: previousHash
  });

  /*
   * Anchor the accepted custody event on blockchain.
   */
  let blockchain: { anchorId: string | null; transactionHash: string | null; blockNumber: number | null } = {
    anchorId: null,
    transactionHash: null,
    blockNumber: null
  };

  try {
    const res = await anchorCustodyEvent({
      evidenceId: transfer.evidenceId,
      caseId: transfer.evidence.caseId,
      transferId: transfer.id,
      sequence,
      eventHash
    });
    blockchain = res;
  } catch (error) {
    console.error("Custody event blockchain anchoring warning:", error);
  }

  /*
   * Finalize the custody state and record the custody event.
   */
  const result = await prisma.$transaction(async (tx) => {
    const updatedTransfer = await tx.custodyTransfer.update({
      where: {
        id: transfer.id
      },
      data: {
        status: "ACCEPTED",
        respondedAt: acceptedAt
      }
    });

    const updatedEvidence = await tx.evidence.update({
      where: {
        id: transfer.evidenceId
      },
      data: {
        currentCustodianId: transfer.toUserId,
        status: "ACTIVE"
      }
    });

    const custodyEvent = await tx.custodyEvent.create({
      data: {
        evidenceId: transfer.evidenceId,
        transferId: transfer.id,
        sequence,
        fromUserId: transfer.fromUserId,
        toUserId: transfer.toUserId,
        reason: transfer.reason,
        eventHash,
        blockchainAnchorId: blockchain.anchorId,
        blockchainTransactionHash: blockchain.transactionHash,
        blockchainBlockNumber: blockchain.blockNumber !== null ? BigInt(blockchain.blockNumber) : null,
        createdAt: acceptedAt
      }
    });

    return {
      updatedTransfer,
      updatedEvidence,
      custodyEvent
    };
  });

  return result;
}

export async function rejectCustodyTransfer(
  transferId: string,
  recipientUserId: string,
  rejectionReason: string
) {
  const transfer = await prisma.custodyTransfer.findUnique({
    where: {
      id: transferId
    },
    include: {
      evidence: true
    }
  });

  if (!transfer) {
    throw new Error("Custody transfer not found");
  }

  if (transfer.status !== "PENDING") {
    throw new Error("Custody transfer is no longer pending");
  }

  if (transfer.toUserId !== recipientUserId) {
    throw new Error("Only the intended recipient can reject this transfer");
  }

  const respondedAt = new Date();

  return prisma.$transaction(async (tx) => {
    const updatedTransfer = await tx.custodyTransfer.update({
      where: {
        id: transfer.id
      },
      data: {
        status: "REJECTED",
        respondedAt,
        rejectionReason
      }
    });

    await tx.evidence.update({
      where: {
        id: transfer.evidenceId
      },
      data: {
        status: "ACTIVE"
      }
    });

    return updatedTransfer;
  });
}

export async function getCustodyHistory(evidenceId: string) {
  return prisma.custodyEvent.findMany({
    where: {
      evidenceId
    },
    orderBy: {
      sequence: "asc"
    },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      toUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      transfer: {
        select: {
          id: true,
          requestedAt: true,
          respondedAt: true,
          status: true
        }
      }
    }
  });
}

export async function verifyCustodyHistory(evidenceId: string) {
  const events = await prisma.custodyEvent.findMany({
    where: {
      evidenceId
    },
    orderBy: {
      sequence: "asc"
    }
  });

  const failures: Array<{
    sequence: number;
    reason: string;
  }> = [];

  let previousHash: string | null = null;

  for (let index = 0; index < events.length; index++) {
    const event = events[index];

    const expectedSequence = index + 1;

    if (event.sequence !== expectedSequence) {
      failures.push({
        sequence: event.sequence,
        reason: "Sequence mismatch"
      });
    }

    const expectedHash = createCustodyEventHash({
      evidenceId: event.evidenceId,
      sequence: event.sequence,
      fromUserId: event.fromUserId,
      toUserId: event.toUserId,
      reason: event.reason,
      transferId: event.transferId,
      createdAt: event.createdAt,
      previousEventHash: previousHash
    });

    if (expectedHash !== event.eventHash) {
      failures.push({
        sequence: event.sequence,
        reason: "Event hash mismatch"
      });
    }

    previousHash = event.eventHash;
  }

  return {
    valid: failures.length === 0,
    totalEvents: events.length,
    failures
  };
}
