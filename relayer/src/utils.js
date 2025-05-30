const fs = require("fs").promises;
const path = require("path");
const config = require("../config");

// Simple logger
class Logger {
  constructor(level = "info") {
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    this.currentLevel = this.levels[level] || 1;
  }

  debug(...args) {
    if (this.currentLevel <= this.levels.debug) {
      console.log(`[${new Date().toISOString()}] [DEBUG]`, ...args);
    }
  }

  info(...args) {
    if (this.currentLevel <= this.levels.info) {
      console.log(`[${new Date().toISOString()}] [INFO]`, ...args);
    }
  }

  warn(...args) {
    if (this.currentLevel <= this.levels.warn) {
      console.warn(`[${new Date().toISOString()}] [WARN]`, ...args);
    }
  }

  error(...args) {
    if (this.currentLevel <= this.levels.error) {
      console.error(`[${new Date().toISOString()}] [ERROR]`, ...args);
    }
  }
}

const logger = new Logger(config.LOG_LEVEL);

// File utilities
async function loadProcessedTxs() {
  try {
    const filePath = config.files.processedTxs;
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, return empty array
      return [];
    }
    logger.error("Failed to load processed transactions:", error);
    return [];
  }
}

async function saveProcessedTxs(txHashes) {
  try {
    const filePath = config.files.processedTxs;
    await fs.writeFile(filePath, JSON.stringify(txHashes, null, 2));
  } catch (error) {
    logger.error("Failed to save processed transactions:", error);
  }
}

// Utility functions
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidBitcoinTxHash(txHash) {
  return /^[a-fA-F0-9]{64}$/.test(txHash);
}

function satoshisToBTC(satoshis) {
  return satoshis / 100000000;
}

function btcToSatoshis(btc) {
  return Math.round(btc * 100000000);
}

function formatAmount(amount, decimals = 8) {
  const divisor = Math.pow(10, decimals);
  return (amount / divisor).toFixed(decimals);
}

// Retry mechanism
async function retry(fn, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      logger.warn(
        `Attempt ${attempt} failed, retrying in ${delay}ms:`,
        error.message
      );
      await sleep(delay * attempt);
    }
  }
}

// Rate limiting
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async waitIfNeeded() {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        logger.debug(`Rate limit reached, waiting ${waitTime}ms`);
        await sleep(waitTime);
      }
    }

    this.requests.push(now);
  }
}

// Health check utilities
async function checkBitcoinConnection(rpcUrl) {
  try {
    const axios = require("axios");
    const response = await axios.get(`${rpcUrl}/blocks/tip/height`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function checkEthereumConnection(rpcUrl) {
  try {
    const { ethers } = require("ethers");
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    await provider.getBlockNumber();
    return true;
  } catch (error) {
    return false;
  }
}

// Configuration validation
function validateConfig() {
  const errors = [];

  if (!config.bitcoin.watchAddress) {
    errors.push("Bitcoin watch address not configured");
  }

  if (!config.ethereum.privateKey) {
    errors.push("Ethereum private key not configured");
  }

  if (!config.ethereum.vaultAddress) {
    errors.push("Vault contract address not configured");
  }

  if (!isValidEthereumAddress(config.ethereum.vaultAddress || "")) {
    errors.push("Invalid vault contract address");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(", ")}`);
  }
}

module.exports = {
  logger,
  loadProcessedTxs,
  saveProcessedTxs,
  sleep,
  retry,
  RateLimiter,
  isValidEthereumAddress,
  isValidBitcoinTxHash,
  satoshisToBTC,
  btcToSatoshis,
  formatAmount,
  checkBitcoinConnection,
  checkEthereumConnection,
  validateConfig,
};
