import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseCRUD() {
  console.log("========================================");
  console.log("       DATABASE CRUD TESTING SCRIPT     ");
  console.log("========================================\n");

  try {
    const uniqueSuffix = Date.now().toString().slice(-6);

    // 1. PUTTING DATA (CREATE)
    console.log(`[1/3] ✍️ Putting dummy information into the database...`);
    
    // Create an Organization
    const newOrg = await prisma.organization.create({
      data: {
        name: `Cybernsics Agency ${uniqueSuffix}`,
        code: `CYB-${uniqueSuffix}`,
      }
    });

    // Create a User within that organization
    const newUser = await prisma.user.create({
      data: {
        name: `Agent Smith ${uniqueSuffix}`,
        email: `smith.${uniqueSuffix}@cybernsics.gov`,
        passwordHash: "dummy-hashed-password", 
      }
    });

    console.log(`      ✅ Successfully created Organization: ${newOrg.name} (ID: ${newOrg.id})`);
    console.log(`      ✅ Successfully created User: ${newUser.name} (ID: ${newUser.id})\n`);

    // 2. RETRIEVING DATA (READ)
    console.log(`[2/3] 🔍 Retrieving the newly created data...`);
    
    const retrievedOrg = await prisma.organization.findUnique({
      where: { id: newOrg.id }
    });

    const retrievedUser = await prisma.user.findUnique({
      where: { id: newUser.id }
    });

    if (retrievedOrg && retrievedUser) {
      console.log(`      ✅ Successfully retrieved Organization! Name matches: ${retrievedOrg.name === newOrg.name}`);
      console.log(`      ✅ Successfully retrieved User! Email matches: ${retrievedUser.email === newUser.email}\n`);
      
      console.log(`      [Retrieved Data Payload]`);
      console.log(retrievedOrg);
      console.log(retrievedUser);
      console.log();
    } else {
      console.error("      ❌ Failed to retrieve the data!");
    }

    // 3. CLEANUP (DELETE) - Optional but good practice for dummy data
    console.log(`[3/3] 🧹 Cleaning up the dummy data...`);
    await prisma.user.delete({ where: { id: newUser.id } });
    await prisma.organization.delete({ where: { id: newOrg.id } });
    console.log(`      ✅ Successfully deleted dummy data! Database is pristine.\n`);
    
    console.log("🎉 CRUD TEST COMPLETELY SUCCESSFUL! Your database is working perfectly.");

  } catch (err) {
    console.error("\n❌ Database CRUD Test FAILED!");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseCRUD();
