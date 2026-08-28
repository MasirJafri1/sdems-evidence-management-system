import { prisma } from "../src/lib/prisma";
import {
  checkCasePermission,
  grantCasePermission,
  revokeCasePermission,
  getUserCasePermissions
} from "../src/modules/authorization/authorization.service";
import { PermissionEffect } from "@prisma/client";

describe("Phase 6 Authorization Service Tests", () => {
  let organizationId: string;
  let roleId: string;
  let permissionId: string;
  let adminUser: any;
  let memberUser: any;
  let caseRecord: any;

  beforeAll(async () => {
    // 1. Create Org
    const org = await prisma.organization.create({
      data: {
        name: "Auth Test Org",
        code: `AUTH-ORG-${Date.now()}`
      }
    });
    organizationId = org.id;

    // 2. Create Permission & Role with RolePermission
    const perm = await prisma.permission.upsert({
      where: { name: "DOCUMENT_READ" },
      update: {},
      create: { name: "DOCUMENT_READ", description: "View document metadata" }
    });
    permissionId = perm.id;

    const role = await prisma.role.create({
      data: {
        name: "Investigator Role",
        organizationId: org.id,
        permissions: {
          create: [{ permissionId: perm.id }]
        }
      }
    });
    roleId = role.id;

    // 3. Create Users
    adminUser = await prisma.user.create({
      data: {
        name: "Case Admin User",
        email: `admin-${Date.now()}@example.com`,
        passwordHash: "pass",
        memberships: { create: { organizationId: org.id, roleId: role.id } }
      }
    });

    memberUser = await prisma.user.create({
      data: {
        name: "Case Member User",
        email: `member-${Date.now()}@example.com`,
        passwordHash: "pass",
        memberships: { create: { organizationId: org.id, roleId: role.id } }
      }
    });

    // 4. Create Case with Admin and Member participants
    caseRecord = await prisma.case.create({
      data: {
        caseNumber: `CASE-AUTH-${Date.now()}`,
        title: "Authorization Test Case",
        organizationId: org.id,
        createdById: adminUser.id,
        participants: {
          create: [
            { userId: adminUser.id, isCaseAdmin: true },
            { userId: memberUser.id, isCaseAdmin: false }
          ]
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.casePermission.deleteMany({ where: { caseId: caseRecord.id } });
    await prisma.caseParticipant.deleteMany({ where: { caseId: caseRecord.id } });
    await prisma.case.deleteMany({ where: { id: caseRecord.id } });
    await prisma.organizationMembership.deleteMany({ where: { organizationId } });
    await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, memberUser.id] } } });
    await prisma.role.deleteMany({ where: { id: roleId } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  test("Case admin gets full access automatically", async () => {
    const result = await checkCasePermission({
      userId: adminUser.id,
      caseId: caseRecord.id,
      permissionName: "DOCUMENT_READ"
    });

    expect(result.allowed).toBe(true);
    expect(result.source).toBe("CASE_ADMIN");
  });

  test("Active participant receives permission via role fallback", async () => {
    const result = await checkCasePermission({
      userId: memberUser.id,
      caseId: caseRecord.id,
      permissionName: "DOCUMENT_READ"
    });

    expect(result.allowed).toBe(true);
    expect(result.source).toBe("ROLE_PERMISSION");
    expect(result.effect).toBe("GRANT");
  });

  test("Explicit DENY overrides role-based permission", async () => {
    await grantCasePermission(
      caseRecord.id,
      memberUser.id,
      "DOCUMENT_READ",
      PermissionEffect.DENY,
      adminUser.id
    );

    const result = await checkCasePermission({
      userId: memberUser.id,
      caseId: caseRecord.id,
      permissionName: "DOCUMENT_READ"
    });

    expect(result.allowed).toBe(false);
    expect(result.source).toBe("CASE_PERMISSION");
    expect(result.effect).toBe("DENY");
  });

  test("Revoking explicit DENY restores role permission grant", async () => {
    await revokeCasePermission(caseRecord.id, memberUser.id, "DOCUMENT_READ");

    const result = await checkCasePermission({
      userId: memberUser.id,
      caseId: caseRecord.id,
      permissionName: "DOCUMENT_READ"
    });

    expect(result.allowed).toBe(true);
    expect(result.source).toBe("ROLE_PERMISSION");
  });

  test("Expired GRANT permission is ignored", async () => {
    // Ensure permission exists in DB
    await prisma.permission.upsert({
      where: { name: "EVIDENCE_CREATE" },
      update: {},
      create: { name: "EVIDENCE_CREATE" }
    });

    const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
    await grantCasePermission(
      caseRecord.id,
      memberUser.id,
      "EVIDENCE_CREATE",
      PermissionEffect.GRANT,
      adminUser.id,
      pastDate
    );

    const result = await checkCasePermission({
      userId: memberUser.id,
      caseId: caseRecord.id,
      permissionName: "EVIDENCE_CREATE"
    });

    // EVIDENCE_CREATE is not in member's role, and explicit grant is expired -> forbidden
    expect(result.allowed).toBe(false);
    expect(result.source).toBe("NONE");
  });

  test("List user case permissions", async () => {
    const list = await getUserCasePermissions(caseRecord.id, memberUser.id);
    expect(Array.isArray(list)).toBe(true);
  });
});
