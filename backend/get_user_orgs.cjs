const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@cbi.gov' },
    include: {
      memberships: {
        include: {
          organization: true,
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  console.log("User details:", JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
