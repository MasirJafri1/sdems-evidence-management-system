const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cases = await prisma.case.findMany({
    include: {
      documents: {
        include: {
          versions: true
        }
      },
      _count: {
        select: {
          documents: true,
          evidence: true
        }
      }
    }
  });

  const replacer = (key, value) => typeof value === 'bigint' ? value.toString() : value;

  console.log("Cases in DB:", JSON.stringify(cases, replacer, 2));

  const allDocs = await prisma.document.findMany({
    include: {
      versions: true
    }
  });
  console.log("All Documents in DB:", JSON.stringify(allDocs, replacer, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
