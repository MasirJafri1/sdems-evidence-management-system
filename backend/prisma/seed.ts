import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const permissions = [
  {
    name: "CASE_CREATE",
    description: "Create a new case"
  },
  {
    name: "CASE_READ",
    description: "View cases"
  },
  {
    name: "CASE_MANAGE_PARTICIPANTS",
    description: "Add or remove case participants"
  },
  {
    name: "USER_CREATE",
    description: "Create users inside an organization"
  },
  {
    name: "USER_READ",
    description: "View organization users"
  },
  {
    name: "ROLE_CREATE",
    description: "Create organization roles"
  },
  {
    name: "ROLE_READ",
    description: "View organization roles"
  },
  {
    name: "DOCUMENT_CREATE",
    description: "Upload documents to cases"
  },
  {
    name: "DOCUMENT_READ",
    description: "View document metadata"
  },
  {
    name: "DOCUMENT_DOWNLOAD",
    description: "Download documents"
  },
  {
    name: "DOCUMENT_VERSION_CREATE",
    description: "Create a new document version"
  }
];

async function main() {
  console.log("Seeding permissions...");

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        name: permission.name
      },
      update: {
        description: permission.description
      },
      create: permission
    });
  }

  console.log("Permissions seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
