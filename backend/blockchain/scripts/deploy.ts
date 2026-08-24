import { network } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const { ethers } = await network.create();

const [deployer] = await ethers.getSigners();

console.log("Deploying EvidenceRegistry...");
console.log("Deployer:", deployer.address);

const registry = await ethers.deployContract("EvidenceRegistry", [
  deployer.address
]);

await registry.waitForDeployment();

const address = await registry.getAddress();
const networkInfo = await ethers.provider.getNetwork();
const chainId = networkInfo.chainId.toString();

console.log("EvidenceRegistry:", address);
console.log("Chain ID:", chainId);

const deployment = {
  contractName: "EvidenceRegistry",
  address,
  chainId,
  deployer: deployer.address,
  deployedAt: new Date().toISOString()
};

const outputPath = resolve("deployments", "localhost", "EvidenceRegistry.json");

await mkdir(dirname(outputPath), {
  recursive: true
});

await writeFile(outputPath, JSON.stringify(deployment, null, 2), "utf8");

console.log(`Deployment saved to ${outputPath}`);
