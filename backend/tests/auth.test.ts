import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";

describe("Auth API Integration Tests", () => {
  beforeAll(async () => {
    await prisma.organization.deleteMany({
      where: { code: "TEST_AUTH_ORG" }
    });
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({
      where: { code: "TEST_AUTH_ORG" }
    });
    await prisma.user.deleteMany({
      where: { email: "auth_test_admin@test.com" }
    });
    await prisma.$disconnect();
  });

  test("POST /api/organizations/bootstrap — setup organization and admin user", async () => {
    const response = await request(app)
      .post("/api/organizations/bootstrap")
      .send({
        organizationName: "Test Auth Organization",
        organizationCode: "TEST_AUTH_ORG",
        adminName: "Auth Admin",
        adminEmail: "auth_test_admin@test.com",
        adminPassword: "Password123!"
      });

    expect([200, 201]).toContain(response.status);
  });

  test("POST /api/auth/login — login as admin user", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "auth_test_admin@test.com",
      password: "Password123!"
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  test("POST /api/auth/login — fail with incorrect credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "auth_test_admin@test.com",
      password: "WrongPassword!"
    });

    expect(response.status).toBe(401);
  });
});
