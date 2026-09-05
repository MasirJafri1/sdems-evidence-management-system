import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
  { name: "CASE_CREATE", description: "Create a new case" },
  { name: "CASE_READ", description: "Read case information" },
  { name: "CASE_UPDATE", description: "Update case information" },
  { name: "CASE_PARTICIPANT_MANAGE", description: "Manage case participants" },
  { name: "DOCUMENT_READ", description: "Read documents" },
  { name: "DOCUMENT_UPLOAD", description: "Upload documents" },
  { name: "DOCUMENT_UPDATE", description: "Update documents" },
  { name: "DOCUMENT_DOWNLOAD", description: "Download documents" },
  { name: "DOCUMENT_VERIFY", description: "Verify document integrity" },
  { name: "EVIDENCE_CREATE", description: "Create evidence" },
  { name: "EVIDENCE_READ", description: "Read evidence" },
  { name: "EVIDENCE_UPDATE", description: "Update evidence" },
  { name: "CUSTODY_TRANSFER", description: "Transfer evidence" },
  { name: "CUSTODY_ACCEPT", description: "Accept custody" },
  { name: "CUSTODY_REJECT", description: "Reject custody" },
  { name: "CUSTODY_HISTORY_READ", description: "Read custody history" },
  { name: "AUDIT_READ", description: "Read audit history" },
  { name: "CASE_PERMISSION_GRANT", description: "Grant case permission" },
  { name: "CASE_PERMISSION_REVOKE", description: "Revoke case permission" },
  { name: "ROLE_CREATE", description: "Create organization roles" },
  { name: "ROLE_READ", description: "Read organization roles" },
  { name: "USER_CREATE", description: "Create organization users" },
  { name: "USER_READ", description: "Read organization users" }
];

async function seedSuperAdmin() {
  console.log("==========================================");
  console.log("   SEEDING GLOBAL SUPER ADMIN & PERMISSIONS ");
  console.log("==========================================\n");

  try {
    // 0. Clear all existing data from database tables
    console.log("🧹 Clearing all existing database tables...");
    await prisma.custodyTransfer.deleteMany({});
    await prisma.custodyEvent.deleteMany({});
    await prisma.evidence.deleteMany({});
    await prisma.documentVersion.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.casePermission.deleteMany({});
    await prisma.caseParticipant.deleteMany({});
    await prisma.case.deleteMany({});
    await prisma.auditEvent.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.organizationMembership.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    console.log("✅ Database tables successfully cleared!\n");

    // 1. Seed System Permissions
    console.log("🔑 Seeding system permission matrix...");
    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: { description: permission.description },
        create: permission
      });
    }

    // 2. Create Global Standalone Super Admin Account (No Org Association)
    console.log("👤 Seeding Unassociated Standalone Super Admin Account...");
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    await prisma.user.upsert({
      where: { email: "superadmin@gov.in" },
      update: { passwordHash: hashedPassword },
      create: {
        name: "System Super Admin",
        email: "superadmin@gov.in",
        passwordHash: hashedPassword
      }
    });

    console.log("\n✅ GLOBAL STANDALONE SUPER ADMIN SEEDED SUCCESSFULLY!");
    console.log("==========================================");
    console.log("  Role              : Unassociated Global Super Admin");
    console.log("  Official Email    : superadmin@gov.in");
    console.log("  Default Password  : Password123!");
    console.log("==========================================\n");
  } catch (error) {
    console.error("❌ Error seeding Super Admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedSuperAdmin();
