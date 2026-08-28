import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";
import { signToken } from "../src/utils/jwt";

describe("Phase 6 Authorization API Integration Tests", () => {
  let organizationId: string;
  let adminUser: { id: string; token: string };
  let memberUser: { id: string; token: string };
  let caseId: string;

  beforeAll(async () => {
    // 1. Create Org
    const org = await prisma.organization.create({
      data: {
        name: "Auth API Org",
        code: `AUTH-API-${Date.now()}`
      }
    });
    organizationId = org.id;

    // 2. Create Role
    const role = await prisma.role.create({
      data: {
        name: "Analyst Role",
        organizationId: org.id
      }
    });

    // 3. Create Users & Tokens
    const uAdmin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: `auth-admin-${Date.now()}@example.com`,
        passwordHash: "pass",
        memberships: { create: { organizationId: org.id, roleId: role.id } }
      }
    });
    adminUser = { id: uAdmin.id, token: signToken({ userId: uAdmin.id }) };

    const uMember = await prisma.user.create({
      data: {
        name: "Member User",
        email: `auth-member-${Date.now()}@example.com`,
        passwordHash: "pass",
        memberships: { create: { organizationId: org.id, roleId: role.id } }
      }
    });
    memberUser = { id: uMember.id, token: signToken({ userId: uMember.id }) };

    // 4. Create Case
    const caseRecord = await prisma.case.create({
      data: {
        caseNumber: `CASE-API-${Date.now()}`,
        title: "Auth API Case",
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
    caseId = caseRecord.id;

    // Ensure permissions exist
    await prisma.permission.upsert({
      where: { name: "DOCUMENT_READ" },
      update: {},
      create: { name: "DOCUMENT_READ" }
    });
    await prisma.permission.upsert({
      where: { name: "EVIDENCE_CREATE" },
      update: {},
      create: { name: "EVIDENCE_CREATE" }
    });
  });

  afterAll(async () => {
    await prisma.casePermission.deleteMany({ where: { caseId } });
    await prisma.caseParticipant.deleteMany({ where: { caseId } });
    await prisma.case.deleteMany({ where: { id: caseId } });
    await prisma.organizationMembership.deleteMany({ where: { organizationId } });
    await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, memberUser.id] } } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  test("POST /api/authorization/cases/:caseId/permissions - grant permission", async () => {
    const res = await request(app)
      .post(`/api/authorization/cases/${caseId}/permissions`)
      .set("Authorization", `Bearer ${adminUser.token}`)
      .send({
        userId: memberUser.id,
        permissionName: "EVIDENCE_CREATE",
        effect: "GRANT"
      });

    expect(res.status).toBe(201);
    expect(res.body.permission).toBeDefined();
    expect(res.body.permission.effect).toBe("GRANT");
  });

  test("GET /api/authorization/cases/:caseId/permissions/check - check granted permission", async () => {
    const res = await request(app)
      .get(`/api/authorization/cases/${caseId}/permissions/check?permission=EVIDENCE_CREATE`)
      .set("Authorization", `Bearer ${memberUser.token}`);

    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(true);
    expect(res.body.source).toBe("CASE_PERMISSION");
  });

  test("GET /api/authorization/cases/:caseId/users/:userId/permissions - list permissions", async () => {
    const res = await request(app)
      .get(`/api/authorization/cases/${caseId}/users/${memberUser.id}/permissions`)
      .set("Authorization", `Bearer ${adminUser.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.permissions)).toBe(true);
    expect(res.body.permissions.length).toBeGreaterThanOrEqual(1);
  });

  test("DELETE /api/authorization/cases/:caseId/permissions - revoke permission", async () => {
    const res = await request(app)
      .delete(`/api/authorization/cases/${caseId}/permissions`)
      .set("Authorization", `Bearer ${adminUser.token}`)
      .send({
        userId: memberUser.id,
        permissionName: "EVIDENCE_CREATE"
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Case permission revoked");
  });
});
