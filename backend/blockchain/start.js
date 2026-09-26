import { spawn } from "node:child_process";

const port = process.env.PORT || "8545";
console.log(`[Render Blockchain] Launching Hardhat node on port ${port}...`);

const nodeProcess = spawn("npx", ["hardhat", "node", "--hostname", "0.0.0.0", "--port", port], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env }
});

setTimeout(() => {
  console.log("[Render Blockchain] Auto-deploying EvidenceRegistry contract...");
  const targetUrl = `http://127.0.0.1:${port}`;
  const deployProcess = spawn("npx", ["hardhat", "run", "scripts/deploy.ts", "--network", "localhost"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, HARDHAT_NETWORK_URL: targetUrl }
  });

  deployProcess.on("exit", (code) => {
    if (code === 0) {
      console.log("[Render Blockchain] Contract successfully deployed!");
    } else {
      console.error(`[Render Blockchain] Deploy script exited with code ${code}`);
    }
  });
}, 5000);

nodeProcess.on("exit", (code) => {
  console.log(`[Render Blockchain] Node process exited with code ${code}`);
  process.exit(code || 0);
});
