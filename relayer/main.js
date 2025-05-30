const BabylonWatcher = require("./src/babylonWatcher");
const EVMTrigger = require("./src/evmTrigger");
const { logger } = require("./src/utils");
const config = require("./config");

/**
 * Enhanced Babylon Relayer - Complete Staking Protocol Simulation
 *
 * This relayer implements a comprehensive simulation of the Babylon staking protocol:
 * - Real-time Bitcoin staking transaction monitoring and validation
 * - Complete finality provider delegation and management system
 * - Staking rewards calculation and automatic distribution
 * - Slashing conditions enforcement with penalty mechanisms
 * - Voting power calculation and network governance simulation
 * - Delegation lifecycle management (staking → rewards → unbonding)
 * - Network statistics tracking and performance metrics
 * - Oracle validation with multi-layer attestation
 * - Enhanced security with duplicate and spoofing prevention
 * - Automatic stBTC minting with proper parameter validation
 */
class BabylonRelayer {
  constructor() {
    this.babylonWatcher = null;
    this.evmTrigger = null;
    this.isRunning = false;
  }

  async start() {
    try {
      logger.info("🚀 Starting Enhanced Babylon Staking Relayer...");
      logger.info("📋 === ENHANCED BABYLON STAKING PROTOCOL ===");
      logger.info(
        "   🏛️ Protocol: Complete Babylon Bitcoin Staking Simulation"
      );
      logger.info(
        `   🔐 Min Confirmations: ${config.CONFIRMATION_BLOCKS}+ blocks`
      );
      logger.info("   ⏰ Feature: Time-locked UTXO deposits with unlocking");
      logger.info("   👥 Feature: Full finality provider delegation system");
      logger.info("   💰 Feature: Automated staking rewards distribution");
      logger.info("   ⚔️ Feature: Slashing conditions and penalty enforcement");
      logger.info("   🗳️ Feature: Voting power calculation and governance");
      logger.info("   📊 Feature: Network statistics and performance tracking");
      logger.info("   🔮 Feature: Enhanced oracle attestation network");
      logger.info("   🛡️ Security: Advanced duplicate & spoofing prevention");
      logger.info("   ⚡ Action: Automatic stBTC minting with full validation");
      logger.info("📋 ===============================================");
      logger.info("");

      // Initialize components
      this.babylonWatcher = new BabylonWatcher();
      this.evmTrigger = new EVMTrigger();

      // Set up comprehensive event handlers
      this.setupEventHandlers();

      // Initialize and start services
      await this.evmTrigger.initialize();
      await this.babylonWatcher.initialize();

      logger.info("✅ EVM trigger initialized");
      logger.info("✅ Enhanced Babylon staking simulator initialized");

      // Display comprehensive system status
      await this.displaySystemStatus();

      // Start monitoring
      await this.babylonWatcher.start();

      this.isRunning = true;

      logger.info("🎯 Enhanced Babylon Staking Relayer is LIVE!");
      logger.info(
        "👁️ Monitoring Babylon time-locked Bitcoin staking deposits..."
      );
      logger.info(
        "💰 Simulating real staking rewards and slashing conditions..."
      );
      logger.info(
        "🗳️ Tracking voting power and finality provider performance..."
      );
      logger.info(
        `🔍 Waiting for ${config.CONFIRMATION_BLOCKS}+ confirmation deposits with finality providers...`
      );
      logger.info("");

      // Start comprehensive health checks
      this.startHealthChecks();

      // Start polling for new UTXOs to the watched address
      setInterval(() => {
        this.babylonWatcher.pollBabylonAddressForDeposits(
          config.BABYLON_WATCH_ADDRESS,
          {
            finalityProvider: config.BABYLON_FINALITY_PROVIDER,
            lockDays: config.BABYLON_LOCK_DAYS,
            watchAddress: config.BABYLON_WATCH_ADDRESS,
          }
        );
      }, config.POLLING_INTERVAL);
    } catch (error) {
      logger.error("❌ Failed to start Enhanced Babylon relayer:", error);
      process.exit(1);
    }
  }

  setupEventHandlers() {
    // Handle Babylon deposits
    this.babylonWatcher.on("babylonDeposit", async (depositData) => {
      try {
        await this.handleBabylonDeposit(depositData);
      } catch (error) {
        logger.error(
          `Failed to handle Babylon deposit ${depositData.btcTxHash}:`,
          error
        );
      }
    });

    // Handle staking events
    this.babylonWatcher.on("babylonStaking", async (stakingEvent) => {
      try {
        await this.handleStakingEvent(stakingEvent);
      } catch (error) {
        logger.error("Failed to handle staking event:", error);
      }
    });

    // Handle rewards distribution
    this.babylonWatcher.on("rewardsDistributed", async (rewardEvent) => {
      try {
        await this.handleRewardsDistribution(rewardEvent);
      } catch (error) {
        logger.error("Failed to handle rewards distribution:", error);
      }
    });

    // Handle slashing events
    this.babylonWatcher.on("slashingExecuted", async (slashingEvent) => {
      try {
        await this.handleSlashingEvent(slashingEvent);
      } catch (error) {
        logger.error("Failed to handle slashing event:", error);
      }
    });

    // Handle epoch updates
    this.babylonWatcher.on("epochUpdate", async (epochEvent) => {
      try {
        await this.handleEpochUpdate(epochEvent);
      } catch (error) {
        logger.error("Failed to handle epoch update:", error);
      }
    });

    // Handle errors
    this.babylonWatcher.on("error", (error) => {
      logger.error("Babylon watcher error:", error);
    });
  }

  async handleBabylonDeposit(depositData) {
    try {
      logger.info("🔔 NEW BABYLON STAKING DEPOSIT DETECTED!");
      logger.info("═══════════════════════════════════════");
      logger.info(`📄 Bitcoin TX: ${depositData.btcTxHash}`);
      logger.info(
        `💰 Amount: ${depositData.amount} satoshis (${(
          depositData.amount / 100000000
        ).toFixed(8)} BTC)`
      );
      logger.info(`👤 Staker: ${depositData.userAddress}`);
      logger.info(
        `⏰ Unlock Time: ${new Date(
          depositData.unlockTime * 1000
        ).toISOString()}`
      );
      logger.info(`👥 Finality Provider: ${depositData.finalityProvider}`);
      logger.info(`📦 Block Height: ${depositData.blockHeight}`);
      logger.info(`🔐 Confirmations: ${depositData.confirmations}`);
      logger.info("═══════════════════════════════════════");

      // Validate with enhanced Babylon oracle
      logger.info("🔮 Validating with enhanced Babylon oracle network...");
      const oracleValidation =
        depositData.oracleValidation ||
        (await this.babylonWatcher.validateWithEnhancedOracle(depositData));

      if (!oracleValidation.isValid) {
        logger.error(
          `❌ Enhanced oracle validation failed: ${oracleValidation.error}`
        );
        logger.error(
          `   Confidence: ${(oracleValidation.confidence * 100).toFixed(
            1
          )}% (required: 75%)`
        );
        return;
      }

      logger.info(
        `✅ Enhanced oracle validation successful (confidence: ${(
          oracleValidation.confidence * 100
        ).toFixed(1)}%)`
      );
      logger.info(`   Validation Hash: ${oracleValidation.validationHash}`);
      logger.info(`   Attestations: ${oracleValidation.attestations.length}`);

      // Check if finality provider is authorized
      const isAuthorized = await this.evmTrigger.isFinalityProviderAuthorized(
        depositData.finalityProvider
      );
      if (!isAuthorized) {
        logger.error(
          `❌ Finality provider not authorized: ${depositData.finalityProvider}`
        );
        return;
      }

      logger.info(
        `✅ Finality provider authorized: ${depositData.finalityProvider}`
      );

      // Process the Babylon deposit with retry logic
      logger.info("🔄 Triggering stBTC mint on EVM with retry logic...");
      const result = await this.evmTrigger.processBabylonDepositWithRetry(
        depositData.btcTxHash,
        depositData.userAddress,
        depositData.amount,
        depositData.unlockTime,
        depositData.finalityProvider,
        3 // max retries
      );

      if (result.success) {
        logger.info("🎉 SUCCESS: Babylon deposit processed successfully!");
        logger.info(`📝 Registration TX: ${result.registerTxHash}`);
        logger.info(`⚡ Mint TX: ${result.mintTxHash}`);
        logger.info(`💎 User ${result.userAddress} now has stBTC tokens!`);
        logger.info(`🏛️ Babylon staking protocol completed successfully`);

        // Log summary
        logger.info("");
        logger.info("📊 === DEPOSIT SUMMARY ===");
        logger.info(`   Bitcoin TX: ${depositData.btcTxHash}`);
        logger.info(
          `   Amount: ${(depositData.amount / 100000000).toFixed(
            8
          )} BTC → stBTC`
        );
        logger.info(
          `   Unlock: ${new Date(
            depositData.unlockTime * 1000
          ).toLocaleDateString()}`
        );
        logger.info(`   Provider: ${depositData.finalityProvider}`);
        logger.info(`   Status: ✅ COMPLETED`);
        logger.info("📊 ========================");
        logger.info("");
      } else {
        logger.error(
          `❌ FAILED: Could not process Babylon deposit: ${result.error}`
        );
      }
    } catch (error) {
      logger.error(
        `Error handling Babylon deposit ${depositData.btcTxHash}:`,
        error
      );
    }
  }

  /**
   * Handle staking events from the enhanced simulation
   */
  async handleStakingEvent(stakingEvent) {
    try {
      logger.info("🏛️ === STAKING EVENT DETECTED ===");
      logger.info(`📋 Event Type: ${stakingEvent.type}`);

      if (stakingEvent.type === "delegation_created") {
        const position = stakingEvent.stakingPosition;
        logger.info(
          `💰 New delegation: ${(position.amount / 100000000).toFixed(8)} BTC`
        );
        logger.info(`👥 To finality provider: ${position.finalityProvider}`);
        logger.info(
          `🗳️ Voting power: ${position.votingPower.toLocaleString()}`
        );
        logger.info(
          `📊 Expected annual return: ${(
            position.rewards.annualRate * 100
          ).toFixed(1)}%`
        );
      }

      // Log network stats
      const stats = stakingEvent.networkStats;
      logger.info("📊 Network Status:");
      logger.info(
        `   💰 Total Staked: ${(stats.totalStaked / 100000000).toFixed(2)} BTC`
      );
      logger.info(`   👥 Total Delegators: ${stats.totalDelegators}`);
      logger.info(`   🏛️ Active Finality Providers: ${stats.activeFinality}`);
      logger.info("=====================================");
    } catch (error) {
      logger.error("Error handling staking event:", error);
    }
  }

  /**
   * Handle rewards distribution events
   */
  async handleRewardsDistribution(rewardEvent) {
    try {
      logger.info("💰 === REWARDS DISTRIBUTION EVENT ===");
      logger.info(
        `💎 Amount Distributed: ${(rewardEvent.amount / 100000000).toFixed(
          8
        )} BTC`
      );
      logger.info(`👥 Recipients: ${rewardEvent.recipientCount} delegators`);
      logger.info(
        `📅 Distribution Time: ${new Date(
          rewardEvent.timestamp * 1000
        ).toISOString()}`
      );
      logger.info("====================================");
    } catch (error) {
      logger.error("Error handling rewards distribution:", error);
    }
  }

  /**
   * Handle slashing events
   */
  async handleSlashingEvent(slashingEvent) {
    try {
      logger.warn("⚔️ === SLASHING EVENT EXECUTED ===");
      logger.warn(`🏛️ Finality Provider: ${slashingEvent.finalityProvider}`);
      logger.warn(
        `💸 Amount Slashed: ${(slashingEvent.amount / 100000000).toFixed(
          8
        )} BTC`
      );
      logger.warn(`⚠️ Reason: ${slashingEvent.reason}`);
      logger.warn(`📊 Severity: ${slashingEvent.severity}`);
      logger.warn(
        `👥 Affected Delegators: ${slashingEvent.affectedDelegators}`
      );
      logger.warn("==================================");
    } catch (error) {
      logger.error("Error handling slashing event:", error);
    }
  }

  /**
   * Handle epoch update events
   */
  async handleEpochUpdate(epochEvent) {
    try {
      logger.info("🕐 === EPOCH UPDATE ===");
      logger.info(`📅 New Epoch: ${epochEvent.epoch}`);
      logger.info(`📊 Network Statistics Updated`);
      logger.info(
        `🏛️ Finality Providers: ${epochEvent.finalityProviders.length}`
      );

      // Log top performing finality providers
      const topProviders = epochEvent.finalityProviders
        .sort((a, b) => b.totalDelegated - a.totalDelegated)
        .slice(0, 3);

      logger.info("🏆 Top Finality Providers:");
      topProviders.forEach((fp, index) => {
        logger.info(
          `   ${index + 1}. ${fp.name}: ${(
            fp.totalDelegated / 100000000
          ).toFixed(2)} BTC delegated`
        );
      });
      logger.info("======================");
    } catch (error) {
      logger.error("Error handling epoch update:", error);
    }
  }

  async displaySystemStatus() {
    try {
      logger.info("📊 === ENHANCED SYSTEM STATUS ===");

      // Network info
      const networkInfo = await this.evmTrigger.getNetworkInfo();
      if (networkInfo) {
        logger.info(
          `🌐 Network: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`
        );
        logger.info(`📦 Block Number: ${networkInfo.blockNumber}`);
        logger.info(`⛽ Gas Price: ${networkInfo.gasPrice} gwei`);
      }

      // Contract addresses
      logger.info(`🏛️ Vault Contract: ${this.evmTrigger.getVaultAddress()}`);
      logger.info(`🪙 stBTC Contract: ${this.evmTrigger.getStBTCAddress()}`);
      logger.info(`👤 Relayer Wallet: ${this.evmTrigger.getWalletAddress()}`);

      // Enhanced Babylon staking stats
      const stakingStats = this.babylonWatcher.getStakingStats();
      logger.info("");
      logger.info("🏛️ === BABYLON STAKING NETWORK ===");
      logger.info(
        `🕐 Current Epoch: ${stakingStats.networkStats.currentEpoch}`
      );
      logger.info(
        `💰 Total Staked: ${(
          stakingStats.networkStats.totalStaked / 100000000
        ).toFixed(4)} BTC`
      );
      logger.info(
        `👥 Total Delegators: ${stakingStats.networkStats.totalDelegators}`
      );
      logger.info(
        `🏛️ Active Finality Providers: ${stakingStats.networkStats.activeFinality}`
      );
      logger.info(
        `💸 Average Commission: ${(
          stakingStats.networkStats.averageCommission * 100
        ).toFixed(1)}%`
      );
      logger.info(
        `📈 Total Rewards Distributed: ${(
          stakingStats.networkStats.totalRewardsDistributed / 100000000
        ).toFixed(4)} BTC`
      );
      logger.info(
        `⚔️ Total Slashed: ${(
          stakingStats.networkStats.totalSlashed / 100000000
        ).toFixed(4)} BTC`
      );
      logger.info(
        `🌐 Network Uptime: ${stakingStats.networkStats.networkUptime.toFixed(
          1
        )}%`
      );

      // Enhanced finality providers
      logger.info("");
      logger.info("👥 === FINALITY PROVIDERS ===");
      const providers = stakingStats.finalityProviders;
      if (providers && typeof providers === "object") {
        Object.entries(providers).forEach(([fpId, fp]) => {
          logger.info(`🏛️ ${fp.name} (${fpId}):`);
          logger.info(
            `   💰 Total Delegated: ${(fp.totalDelegated / 100000000).toFixed(
              4
            )} BTC`
          );
          logger.info(`   👥 Delegators: ${fp.delegatorCount}`);
          logger.info(`   💸 Commission: ${(fp.commission * 100).toFixed(1)}%`);
          logger.info(`   📊 Reputation: ${(fp.reputation * 100).toFixed(1)}%`);
          logger.info(`   ⚡ Uptime: ${(fp.uptime * 100).toFixed(1)}%`);
          logger.info(`   🗳️ Voting Power: ${fp.votingPower.toLocaleString()}`);
          logger.info(`   ⚔️ Slashing Events: ${fp.slashingHistory}`);
          logger.info(`   ✅ Status: ${fp.isActive ? "Active" : "Inactive"}`);
        });
      }

      // Active staking positions
      const positions = stakingStats.stakingPositions || [];
      if (positions.length > 0) {
        logger.info("");
        logger.info("💎 === ACTIVE STAKING POSITIONS ===");
        positions.slice(0, 5).forEach((pos, index) => {
          logger.info(`${index + 1}. ${pos.txHash.slice(0, 16)}...:`);
          logger.info(
            `   💰 Amount: ${(pos.amount / 100000000).toFixed(8)} BTC`
          );
          logger.info(`   👥 Provider: ${pos.finalityProvider}`);
          logger.info(
            `   💎 Rewards: ${(pos.accumulatedRewards / 100000000).toFixed(
              8
            )} BTC`
          );
          logger.info(
            `   🗳️ Voting Power: ${pos.votingPower.toLocaleString()}`
          );
          logger.info(
            `   ⏰ Unlock: ${new Date(
              pos.unlockTime * 1000
            ).toLocaleDateString()}`
          );
        });
        if (positions.length > 5) {
          logger.info(
            `...and ${positions.length - 5} more. Only first 5 shown.`
          );
        }
      }

      // Basic watcher stats
      const watcherStats = this.babylonWatcher.getStats();
      logger.info("");
      logger.info("📋 === MONITORING STATISTICS ===");
      logger.info(
        `📄 Processed Transactions: ${watcherStats.processedTransactions}`
      );
      logger.info(`📍 Staking Addresses: ${watcherStats.stakingAddresses}`);

      // Initial balance check
      await this.evmTrigger.checkAllBalances();

      logger.info("📊 ==============================");
      logger.info("");
    } catch (error) {
      logger.error("Failed to display system status:", error);
    }
  }

  startHealthChecks() {
    // Periodic balance logging (every 10 minutes)
    setInterval(async () => {
      try {
        logger.info("🕐 Periodic Health Check:");
        await this.evmTrigger.checkAllBalances();

        const watcherStats = this.babylonWatcher.getStats();
        logger.info(
          `📊 Processed ${watcherStats.processedTransactions} transactions so far`
        );
        logger.info(`💓 System is healthy and monitoring...`);
        logger.info("");
      } catch (error) {
        logger.error("Health check failed:", error);
      }
    }, 10 * 60 * 1000);

    // Network status check (every 5 minutes)
    setInterval(async () => {
      try {
        const networkInfo = await this.evmTrigger.getNetworkInfo();
        if (networkInfo) {
          logger.debug(
            `📡 Network status: Block ${networkInfo.blockNumber}, Gas ${networkInfo.gasPrice} gwei`
          );
        }
      } catch (error) {
        logger.warn("Network status check failed:", error);
      }
    }, 5 * 60 * 1000);
  }

  async stop() {
    try {
      logger.info("🛑 Stopping Babylon Relayer...");

      this.isRunning = false;

      if (this.babylonWatcher) {
        await this.babylonWatcher.stop();
      }

      if (this.evmTrigger) {
        await this.evmTrigger.stop();
      }

      logger.info("✅ Babylon Relayer stopped gracefully");
      process.exit(0);
    } catch (error) {
      logger.error("Error stopping relayer:", error);
      process.exit(1);
    }
  }

  // CLI and monitoring methods
  async getStatus() {
    return {
      isRunning: this.isRunning,
      babylonWatcher: this.babylonWatcher?.getStats(),
      evmTrigger: {
        vaultAddress: this.evmTrigger?.getVaultAddress(),
        stBTCAddress: this.evmTrigger?.getStBTCAddress(),
        walletAddress: this.evmTrigger?.getWalletAddress(),
      },
      network: await this.evmTrigger?.getNetworkInfo(),
    };
  }

  async manualBalanceCheck() {
    logger.info("📊 Manual Balance Check Requested:");
    await this.evmTrigger.checkAllBalances();
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  if (global.babylonRelayer) {
    await global.babylonRelayer.stop();
  } else {
    process.exit(0);
  }
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  if (global.babylonRelayer) {
    await global.babylonRelayer.stop();
  } else {
    process.exit(0);
  }
});

// Start the Babylon relayer
async function main() {
  try {
    const relayer = new BabylonRelayer();
    global.babylonRelayer = relayer;
    await relayer.start();
  } catch (error) {
    logger.error("Fatal error starting Babylon relayer:", error);
    process.exit(1);
  }
}

// Only start if this file is run directly
if (require.main === module) {
  main();
}

module.exports = BabylonRelayer;

// Watcher configuration
const WATCHED_TXID = process.env.BABYLON_WATCH_TXID;
const WATCHED_VOUT = process.env.BABYLON_WATCH_VOUT;
const WATCHED_BTC_ADDRESS = process.env.BABYLON_WATCH_ADDRESS;
const FINALITY_PROVIDER = process.env.BABYLON_FINALITY_PROVIDER || "fp1";
const LOCK_DAYS = process.env.BABYLON_LOCK_DAYS
  ? Number(process.env.BABYLON_LOCK_DAYS)
  : 30;
const USER_ADDRESS = process.env.BABYLON_USER_ADDRESS || WATCHED_BTC_ADDRESS;

// Poll for new UTXOs to the watched address every 30 seconds
async function pollBabylonAddress(relayer) {
  if (!WATCHED_BTC_ADDRESS) {
    logger.warn("No watched BTC address set for Babylon polling");
    return;
  }
  await relayer.babylonWatcher.pollBabylonAddressForDeposits(
    WATCHED_BTC_ADDRESS,
    {
      finalityProvider: FINALITY_PROVIDER,
      lockDays: LOCK_DAYS,
      userAddress: USER_ADDRESS,
    }
  );
}

// Poll for new Babylon P2WSH UTXOs and trigger minting
async function pollBabylonP2WSHUTXO(relayer) {
  if (!WATCHED_TXID || WATCHED_VOUT === undefined) {
    logger.warn("No watched txid/vout set for Babylon P2WSH polling");
    return;
  }
  const watcher = relayer.babylonWatcher;
  const evmTrigger = relayer.evmTrigger;
  const alreadyProcessed = watcher.processedTxs.has(
    `${WATCHED_TXID}:${WATCHED_VOUT}`
  );
  if (alreadyProcessed) return;
  const isBabylon = await watcher.isBabylonP2WSHUTXO(
    WATCHED_TXID,
    Number(WATCHED_VOUT)
  );
  if (isBabylon) {
    logger.info(
      `🔍 Detected new Babylon P2WSH UTXO: ${WATCHED_TXID}:${WATCHED_VOUT}`
    );
    // Trigger minting of stBTC
    await evmTrigger.mintStBTCFromBabylonP2WSH(
      WATCHED_TXID,
      Number(WATCHED_VOUT)
    );
  } else {
    logger.info(
      `🔍 UTXO ${WATCHED_TXID}:${WATCHED_VOUT} is not a valid Babylon P2WSH`
    );
  }
}

// Exported for testing
module.exports = {
  BabylonRelayer,
  pollBabylonAddress,
  pollBabylonP2WSHUTXO,
};
