const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

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
    console.log("🧹 Clearing all existing database tables...");
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "CustodyEvent", "CustodyTransfer", "Evidence", "BlockchainAnchor", "DocumentVersion", "Document", "CasePermission", "CaseParticipant", "CaseAccessRequest", "AuditEvent", "RolePermission", "OrganizationMembership", "Role", "User", "Organization", "Permission" CASCADE;`
    );
    console.log("✅ Database tables successfully cleared!\n");

    console.log("🔑 Seeding system permission matrix...");
    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: { description: permission.description },
        create: permission
      });
    }

    console.log("👤 Seeding Unassociated Standalone Super Admin Account...");
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    await prisma.user.upsert({
      where: { email: "superadmin@gov.in" },
      update: { passwordHash: hashedPassword, systemRole: "SUPER_ADMIN" },
      create: {
        name: "System Super Admin",
        email: "superadmin@gov.in",
        passwordHash: hashedPassword,
        systemRole: "SUPER_ADMIN"
      }
    });

    console.log("\n✅ GLOBAL STANDALONE SUPER ADMIN SEEDED SUCCESSFULLY!");
    console.log("==========================================");
    console.log("  Role              : Unassociated Global Super Admin (SUPER_ADMIN)");
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
