-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('ACTIVE', 'IN_TRANSFER', 'RELEASED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CustodyTransferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "evidenceNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentCustodianId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustodyTransfer" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "initiatedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "CustodyTransferStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustodyTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustodyEvent" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "eventHash" TEXT NOT NULL,
    "blockchainAnchorId" TEXT,
    "blockchainTransactionHash" TEXT,
    "blockchainBlockNumber" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustodyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_documentVersionId_key" ON "Evidence"("documentVersionId");

-- CreateIndex
CREATE INDEX "Evidence_caseId_idx" ON "Evidence"("caseId");

-- CreateIndex
CREATE INDEX "Evidence_currentCustodianId_idx" ON "Evidence"("currentCustodianId");

-- CreateIndex
CREATE INDEX "Evidence_status_idx" ON "Evidence"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_caseId_evidenceNumber_key" ON "Evidence"("caseId", "evidenceNumber");

-- CreateIndex
CREATE INDEX "CustodyTransfer_evidenceId_idx" ON "CustodyTransfer"("evidenceId");

-- CreateIndex
CREATE INDEX "CustodyTransfer_fromUserId_idx" ON "CustodyTransfer"("fromUserId");

-- CreateIndex
CREATE INDEX "CustodyTransfer_toUserId_idx" ON "CustodyTransfer"("toUserId");

-- CreateIndex
CREATE INDEX "CustodyTransfer_status_idx" ON "CustodyTransfer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CustodyEvent_transferId_key" ON "CustodyEvent"("transferId");

-- CreateIndex
CREATE INDEX "CustodyEvent_evidenceId_sequence_idx" ON "CustodyEvent"("evidenceId", "sequence");

-- CreateIndex
CREATE INDEX "CustodyEvent_eventHash_idx" ON "CustodyEvent"("eventHash");

-- CreateIndex
CREATE INDEX "CustodyEvent_blockchainAnchorId_idx" ON "CustodyEvent"("blockchainAnchorId");

-- CreateIndex
CREATE UNIQUE INDEX "CustodyEvent_evidenceId_sequence_key" ON "CustodyEvent"("evidenceId", "sequence");

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_currentCustodianId_fkey" FOREIGN KEY ("currentCustodianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyTransfer" ADD CONSTRAINT "CustodyTransfer_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyTransfer" ADD CONSTRAINT "CustodyTransfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyTransfer" ADD CONSTRAINT "CustodyTransfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyTransfer" ADD CONSTRAINT "CustodyTransfer_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "CustodyTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enforce Append-Only Trigger for CustodyEvent
CREATE OR REPLACE FUNCTION prevent_custody_event_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'CustodyEvent records are append-only';
END;
$$;

CREATE TRIGGER custody_event_append_only
BEFORE UPDATE OR DELETE
ON "CustodyEvent"
FOR EACH ROW
EXECUTE FUNCTION prevent_custody_event_mutation();
