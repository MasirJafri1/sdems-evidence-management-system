import { PrismaClient } from '@prisma/client';
import { JsonRpcProvider } from 'ethers';

const prisma = new PrismaClient();

async function checkHealth() {
  console.log("========================================");
  console.log("   DATABASE & BLOCKCHAIN HEALTH CHECK   ");
  console.log("========================================\n");

  try {
    console.log("🔍 Checking Supabase PostgreSQL Database...");
    const orgCount = await prisma.organization.count();
    const userCount = await prisma.user.count();
    const caseCount = await prisma.case.count();
    
    console.log("✅ Database Connection: SUCCESS");
    console.log(`   Organizations Found: ${orgCount}`);
    console.log(`   Users Found: ${userCount}`);
    console.log(`   Cases Found: ${caseCount}\n`);
  } catch (err) {
    console.error("❌ Database Connection: FAILED");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }

  try {
    console.log("🔍 Checking Local Hardhat Blockchain...");
    const provider = new JsonRpcProvider("http://127.0.0.1:8545");
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    
    console.log("✅ Blockchain Connection: SUCCESS");
    console.log(`   Network Chain ID: ${network.chainId}`);
    console.log(`   Current Block Number: ${blockNumber}`);
  } catch (err) {
    console.error("❌ Blockchain Connection: FAILED");
    console.error(err);
  }
}

checkHealth();
