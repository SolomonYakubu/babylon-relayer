require("dotenv").config();
const deployments = require("../deployments/localhost.json");

/**
 * Babylon Relayer Configuration
 *
 * All configuration is set directly here for development/testing.
 */

module.exports = {
  NODE_ENV: "development",
  BITCOIN_NETWORK: "testnet",
  BITCOIN_RPC_URL: "https://mempool.space/testnet/api",
  BABYLON_WATCH_ADDRESS:
    "tb1qav3dse2x7wpf4njp2qd7rfs8qmwq6c27gmtewq6s9jurnlryc0ys7kzv35",
  ETHEREUM_RPC_URL: "http://localhost:8545",
  ETHEREUM_CHAIN_ID: 1337,
  PRIVATE_KEY:
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  CONFIRMATION_BLOCKS: 3,
  POLLING_INTERVAL: 30000,
  MAX_RETRIES: 3,
  LOG_LEVEL: "debug",
  BABYLON_FINALITY_PROVIDER: "fp1",
  BABYLON_LOCK_DAYS: 30,
  STBTC_CONTRACT_ADDRESS: deployments.stBTC,
  VAULT_CONTRACT_ADDRESS: deployments.vault,
};
