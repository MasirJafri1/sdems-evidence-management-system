import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";
import { signToken } from "../src/utils/jwt";
import { mockClient } from "aws-sdk-client-mock";
import { S3Client } from "@aws-sdk/client-s3";

const s3Mock = mockClient(S3Client);

describe("Phase 4 — Audit Trail API", () => {
  let token: string;
  let unauthorizedToken: string;
  let userId: string;
  let unauthorizedUserId: string;
  let orgId: string;
  let caseId: string;
  let documentId: string;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "AuditEvent" CASCADE;`);

    const user = await prisma.user.create({
      data: {
        name: "Audit Investigator",
        email: "audit_investigator@test.com",
        passwordHash: "hashed_password"
      }
    });
    userId = user.id;
    token = signToken({ userId: user.id });

    const unauth = await prisma.user.create({
      data: {
        name: "Audit Unauthorized User",
        email: "audit_unauth@test.com",
        passwordHash: "hashed_password"
      }
    });
    unauthorizedUserId = unauth.id;
    unauthorizedToken = signToken({ userId: unauth.id });

    const permissionNames = ["CASE_READ", "DOCUMENT_READ", "DOCUMENT_CREATE"];
    await prisma.permission.createMany({
      data: permissionNames.map((name) => ({ name })),
      skipDuplicates: true
    });
    const permissions = await prisma.permission.findMany({
      where: { name: { in: permissionNames } }
    });

    const org = await prisma.organization.create({
      data: {
        name: "Audit Test Org",
        code: "TEST_AUDIT_ORG",
        roles: {
          create: {
            name: "Investigator",
            permissions: {
              create: permissions.map((p) => ({ permissionId: p.id }))
            }
          }
        }
      },
      include: {
        roles: true
      }
    });
    orgId = org.id;

    await prisma.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        roleId: org.roles[0].id
      }
    });

    const caseRecord = await prisma.case.create({
      data: {
        organizationId: org.id,
        createdById: user.id,
        caseNumber: "CASE-AUDIT-001",
        title: "Audit Test Case",
        participants: {
          create: {
            userId: user.id,
            isCaseAdmin: true
          }
        }
      }
    });
    caseId = caseRecord.id;
  });

  beforeEach(() => {
    s3Mock.reset();
    s3Mock.onAnyCommand().resolves({});
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "AuditEvent" CASCADE;`);
    await prisma.organization.deleteMany({
      where: { code: "TEST_AUDIT_ORG" }
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["audit_investigator@test.com", "audit_unauth@test.com"]
        }
      }
    });
    await prisma.$disconnect();
  });

  test("POST /api/cases/:caseId/documents — upload document creates DOCUMENT_CREATED audit event", async () => {
    const response = await request(app)
      .post(`/api/cases/${caseId}/documents`)
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Evidence Photo")
      .field("description", "Crime scene photo")
      .field("documentType", "IMAGE")
      .attach("file", Buffer.from("CRIME SCENE PHOTO DATA"), {
        filename: "photo.jpg",
        contentType: "image/jpeg"
      });

    expect(response.status).toBe(201);
    documentId = response.body.document.id;
  });

  test("GET /api/documents/:documentId — view document creates DOCUMENT_VIEWED event", async () => {
    const response = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test("GET /api/documents/:documentId — unauthorized view creates ACCESS_DENIED event", async () => {
    const response = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${unauthorizedToken}`);

    expect(response.status).toBe(403);
  });

  test("GET /api/cases/:caseId/audit — fetch audit history", async () => {
    const response = await request(app)
      .get(`/api/cases/${caseId}/audit`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.caseId).toBe(caseId);
    expect(response.body.totalEvents).toBeGreaterThan(0);
    expect(Array.isArray(response.body.events)).toBe(true);

    const eventTypes = response.body.events.map((e: any) => e.eventType);
    expect(eventTypes).toContain("DOCUMENT_CREATED");
    expect(eventTypes).toContain("DOCUMENT_VIEWED");
    expect(eventTypes).toContain("ACCESS_DENIED");
  });

  test("GET /api/cases/:caseId/audit/verify — verify audit hash chain integrity", async () => {
    const response = await request(app)
      .get(`/api/cases/${caseId}/audit/verify`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.caseId).toBe(caseId);
    if (!response.body.valid) {
      console.log(
        "Audit Chain Failures:",
        JSON.stringify(response.body.failures, null, 2)
      );
    }
    expect(response.body.valid).toBe(true);
    expect(response.body.failures).toHaveLength(0);
  });
});
