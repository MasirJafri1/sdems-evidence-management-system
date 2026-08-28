import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";
import { signToken } from "../src/utils/jwt";
import { PermissionEffect } from "@prisma/client";

describe("Cross-Organization & Fine-Grained Authorization Tests", () => {
  let policeOrg: any;
  let fslOrg: any;

  let policeRole: any;
  let fslRole: any;

  let policeAdmin: { id: string; token: string };
  let policeMember: { id: string; token: string };
  let fslAnalyst: { id: string; token: string };

  let caseId: string;
  let caseReadPermissionId: string;
  let docReadPermissionId: string;

  beforeAll(async () => {
    // 1. Create Police & FSL Organizations
    policeOrg = await prisma.organization.create({
      data: { name: "Police Department", code: `POLICE-${Date.now()}` }
    });

    fslOrg = await prisma.organization.create({
      data: { name: "Forensic Science Lab", code: `FSL-${Date.now()}` }
    });

    // 2. Ensure Permissions Exist
    const permCaseRead = await prisma.permission.upsert({
      where: { name: "CASE_READ" },
      update: {},
      create: { name: "CASE_READ" }
    });
    caseReadPermissionId = permCaseRead.id;

    const permDocRead = await prisma.permission.upsert({
      where: { name: "DOCUMENT_READ" },
      update: {},
      create: { name: "DOCUMENT_READ" }
    });
    docReadPermissionId = permDocRead.id;

    // 3. Create Roles
    policeRole = await prisma.role.create({
      data: {
        name: "Police Investigator",
        organizationId: policeOrg.id,
        permissions: { create: [{ permissionId: caseReadPermissionId }, { permissionId: docReadPermissionId }] }
      }
    });

    fslRole = await prisma.role.create({
      data: {
        name: "FSL Analyst",
        organizationId: fslOrg.id,
        permissions: { create: [{ permissionId: caseReadPermissionId }, { permissionId: docReadPermissionId }] }
      }
    });

    // 4. Create Users & Tokens
    const uPoliceAdmin = await prisma.user.create({
      data: {
        name: "Police Admin",
        email: `police-admin-${Date.now()}@example.com`,
        passwordHash: "pass",
        memberships: { create: { organizationId: policeOrg.id, roleId: policeRole.id } }
      }
    });
    policeAdmin = { id: uPoliceAdmin.id, token: signToken({ userId: uPoliceAdmin.id }) };

    const uPoliceMember = await prisma.user.create({
      data: {
        name: "Police Officer B",
        email: `police-b-${Date.now()}@example.com`,
        passwordHash: "pass",
        memberships: { create: { organizationId: policeOrg.id, roleId: policeRole.id } }
      }
    });
    policeMember = { id: uPoliceMember.id, token: signToken({ userId: uPoliceMember.id }) };

    const uFslAnalyst = await prisma.user.create({
      data: {
        name: "FSL Analyst B",
        email: `fsl-b-${Date.now()}@example.com`,
        passwordHash: "pass",
        memberships: { create: { organizationId: fslOrg.id, roleId: fslRole.id } }
      }
    });
    fslAnalyst = { id: uFslAnalyst.id, token: signToken({ userId: uFslAnalyst.id }) };

    // 5. Create Police Case (Case 001 owned by Police)
    const caseRecord = await prisma.case.create({
      data: {
        caseNumber: `CASE-POLICE-${Date.now()}`,
        title: "Homicide Investigation 001",
        organizationId: policeOrg.id,
        createdById: policeAdmin.id,
        participants: {
          create: [
            { userId: policeAdmin.id, isCaseAdmin: true }
          ]
        }
      }
    });
    caseId = caseRecord.id;
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "CustodyEvent", "AuditEvent" CASCADE;`);
    await prisma.casePermission.deleteMany({ where: { caseId } });
    await prisma.custodyTransfer.deleteMany({ where: { evidence: { caseId } } });
    await prisma.evidence.deleteMany({ where: { caseId } });
    await prisma.documentVersion.deleteMany({ where: { document: { caseId } } });
    await prisma.document.deleteMany({ where: { caseId } });
    await prisma.caseParticipant.deleteMany({ where: { caseId } });
    await prisma.case.deleteMany({ where: { id: caseId } });
    await prisma.organizationMembership.deleteMany({ where: { organizationId: { in: [policeOrg.id, fslOrg.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [policeAdmin.id, policeMember.id, fslAnalyst.id] } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: { in: [policeRole.id, fslRole.id] } } });
    await prisma.role.deleteMany({ where: { id: { in: [policeRole.id, fslRole.id] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [policeOrg.id, fslOrg.id] } } });
    await prisma.$disconnect();
  });

  test("FSL user cannot access Police case initially (403)", async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}`)
      .set("Authorization", `Bearer ${fslAnalyst.token}`);

    expect(res.status).toBe(403);
  });

  test("Same org user cannot access case if not a participant (403)", async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}`)
      .set("Authorization", `Bearer ${policeMember.token}`);

    expect(res.status).toBe(403);
  });

  test("Cross-org user added as participant gets access after permission grant (200)", async () => {
    // Add FSL Analyst as case participant
    const partRes = await request(app)
      .post(`/api/cases/${caseId}/participants`)
      .set("Authorization", `Bearer ${policeAdmin.token}`)
      .send({
        userId: fslAnalyst.id,
        isCaseAdmin: false
      });
    expect(partRes.status).toBe(201);

    // Grant CASE_READ permission explicitly
    const permRes = await request(app)
      .post(`/api/authorization/cases/${caseId}/permissions`)
      .set("Authorization", `Bearer ${policeAdmin.token}`)
      .send({
        userId: fslAnalyst.id,
        permissionName: "CASE_READ",
        effect: "GRANT"
      });
    expect(permRes.status).toBe(201);

    // FSL Analyst now gets 200 OK
    const getRes = await request(app)
      .get(`/api/cases/${caseId}`)
      .set("Authorization", `Bearer ${fslAnalyst.token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(caseId);
  });

  test("Explicit case-level DENY overrides role GRANT (403)", async () => {
    // Configure explicit DENY for CASE_READ
    await request(app)
      .post(`/api/authorization/cases/${caseId}/permissions`)
      .set("Authorization", `Bearer ${policeAdmin.token}`)
      .send({
        userId: fslAnalyst.id,
        permissionName: "CASE_READ",
        effect: "DENY"
      });

    const getRes = await request(app)
      .get(`/api/cases/${caseId}`)
      .set("Authorization", `Bearer ${fslAnalyst.token}`);

    expect(getRes.status).toBe(403);
  });
});
