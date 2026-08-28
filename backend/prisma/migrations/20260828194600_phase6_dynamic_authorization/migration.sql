-- CreateEnum
CREATE TYPE "PermissionEffect" AS ENUM ('GRANT', 'DENY');

-- CreateTable
CREATE TABLE "CasePermission" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "effect" "PermissionEffect" NOT NULL DEFAULT 'GRANT',
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CasePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CasePermission_caseId_idx" ON "CasePermission"("caseId");

-- CreateIndex
CREATE INDEX "CasePermission_userId_idx" ON "CasePermission"("userId");

-- CreateIndex
CREATE INDEX "CasePermission_permissionId_idx" ON "CasePermission"("permissionId");

-- CreateIndex
CREATE INDEX "CasePermission_expiresAt_idx" ON "CasePermission"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CasePermission_caseId_userId_permissionId_key" ON "CasePermission"("caseId", "userId", "permissionId");

-- AddForeignKey
ALTER TABLE "CasePermission" ADD CONSTRAINT "CasePermission_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasePermission" ADD CONSTRAINT "CasePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasePermission" ADD CONSTRAINT "CasePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasePermission" ADD CONSTRAINT "CasePermission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
