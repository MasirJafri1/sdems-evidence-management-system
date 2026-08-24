import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";
import { mockClient } from "aws-sdk-client-mock";
import { S3Client } from "@aws-sdk/client-s3";
import { hashPassword } from "../src/utils/password";
import { signToken } from "../src/utils/jwt";

const s3Mock = mockClient(S3Client);

describe("Document API Integration Tests", () => {
  jest.setTimeout(30000);

  let token: string;
  let unauthorizedToken: string;
  let caseId: string;
  let documentId: string;

  beforeAll(async () => {
    // Clean up test data if present
    await prisma.organization.deleteMany({
      where: { code: "TEST_DOC_ORG" }
    });

    // Create required permissions
    const permNames = [
      "DOCUMENT_CREATE",
      "DOCUMENT_READ",
      "DOCUMENT_DOWNLOAD",
      "DOCUMENT_VERSION_CREATE"
    ];

    const perms = [];
    for (const name of permNames) {
      const perm = await prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name, description: `Permission for ${name}` }
      });
      perms.push(perm);
    }

    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: "Test Doc Org",
        code: "TEST_DOC_ORG"
      }
    });

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name: "Investigator",
        organizationId: org.id,
        permissions: {
          create: perms.map((p) => ({ permissionId: p.id }))
        }
      }
    });

    // Create test user
    const passwordHash = await hashPassword("Password123!");
    const user = await prisma.user.create({
      data: {
        email: "doc_test_investigator@test.com",
        name: "Test Investigator",
        passwordHash,
        memberships: {
          create: {
            organizationId: org.id,
            roleId: role.id
          }
        }
      }
    });

    // Create unauthorized user
    const unauthPasswordHash = await hashPassword("Password123!");
    const unauthUser = await prisma.user.create({
      data: {
        email: "doc_test_unauth@test.com",
        name: "Unauth User",
        passwordHash: unauthPasswordHash
      }
    });

    // Generate tokens
    token = signToken({ userId: user.id });
    unauthorizedToken = signToken({ userId: unauthUser.id });

    // Create case and add authorized user as participant
    const caseRecord = await prisma.case.create({
      data: {
        caseNumber: "CASE-DOC-001",
        title: "Test Case for Documents",
        organizationId: org.id,
        createdById: user.id,
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
    await prisma.organization.deleteMany({
      where: { code: "TEST_DOC_ORG" }
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["doc_test_investigator@test.com", "doc_test_unauth@test.com"]
        }
      }
    });
    await prisma.$disconnect();
  });

  test("POST /api/cases/:caseId/documents — upload document", async () => {
    const response = await request(app)
      .post(`/api/cases/${caseId}/documents`)
      .set("Authorization", `Bearer ${token}`)
      .field("title", "FIR Report")
      .field("description", "Original FIR document")
      .field("documentType", "FIR")
      .attach("file", Buffer.from("FIR FILE CONTENT"), {
        filename: "FIR.pdf",
        contentType: "application/pdf"
      });

    expect(response.status).toBe(201);
    expect(response.body.document).toBeDefined();
    expect(response.body.document.title).toBe("FIR Report");
    expect(response.body.version).toBeDefined();
    expect(response.body.version.versionNumber).toBe(1);
    expect(response.body.version.sha256Hash).toHaveLength(64);

    documentId = response.body.document.id;
  });

  test("GET /api/cases/:caseId/documents — list documents", async () => {
    const response = await request(app)
      .get(`/api/cases/${caseId}/documents`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].id).toBe(documentId);
  });

  test("GET /api/documents/:documentId — fetch individual document", async () => {
    const response = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(documentId);
    expect(response.body.versions).toBeDefined();
    expect(response.body.versions.length).toBe(1);
  });

  test("GET /api/documents/:documentId — reject unauthorized user access", async () => {
    const response = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${unauthorizedToken}`);

    expect([401, 403]).toContain(response.status);
  });

  test("POST /api/documents/:documentId/versions — upload new document version", async () => {
    const response = await request(app)
      .post(`/api/documents/${documentId}/versions`)
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("FIR CORRECTED FILE CONTENT"), {
        filename: "FIR_corrected.pdf",
        contentType: "application/pdf"
      });

    expect(response.status).toBe(201);
    expect(response.body.documentId).toBe(documentId);
    expect(response.body.currentVersion).toBe(2);
    expect(response.body.version.versionNumber).toBe(2);
    expect(response.body.version.originalFileName).toBe("FIR_corrected.pdf");
  });

  test("GET /api/documents/:documentId/versions/:versionNumber/download — download presigned URL", async () => {
    const response = await request(app)
      .get(`/api/documents/${documentId}/versions/1/download`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.documentId).toBe(documentId);
    expect(response.body.versionNumber).toBe(1);
    expect(response.body.downloadUrl).toBeDefined();
  });
});
