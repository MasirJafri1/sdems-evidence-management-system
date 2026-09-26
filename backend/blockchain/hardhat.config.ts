import { defineConfig } from "hardhat/config";

import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],

  solidity: {
    profiles: {
      default: {
        version: "0.8.28"
      },

      production: {
        version: "0.8.28",

        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    }
  },

  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1"
    },

    localhost: {
      type: "http",
      url: process.env.HARDHAT_NETWORK_URL || "http://127.0.0.1:8545",

      chainType: "l1",

      ethers: {
        waitForTransactionReceipt: true
      }
    }
  }
});
