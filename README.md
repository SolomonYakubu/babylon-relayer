# Babylon Relayer: End-to-End BTC Staking & stBTC Minting

This project enables end-to-end simulation and testing of BTC staking and stBTC minting using a Babylon-compatible P2WSH address and real Bitcoin testnet transactions.

## Prerequisites

- Node.js and npm installed (v16+ recommended)
- Hardhat (for local Ethereum node and contract deployment)
- Bitcoin testnet faucet access

## Step-by-Step Installation & End-to-End Flow

### 1. Clone the Repository

```zsh
git clone <repository-url>
cd babylon-relayer-project
```

### 2. Install All Dependencies

Use the provided setup script to install dependencies for both the main project and the relayer:

```zsh
npm run setup
```

### 3. Start a Local Ethereum Node

You must start a local Ethereum node before deploying contracts or running the relayer:

```zsh
npx hardhat node
```

Leave this terminal running.

### 4. Deploy Contracts

In a new terminal, deploy the Vault and stBTC contracts to your running node:

```zsh
npx hardhat run scripts/deploy.js --network localhost
```

This will create a `deployments/localhost.json` file with the deployed contract addresses.

### 5. Configuration

All configuration is now set directly in `relayer/config.js` for development/testing. No .env file is required. The default configuration is:

```js
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
```

#### Babylon Watch Address

You can use the **default Babylon-compatible watch address** below to receive testnet BTC and mint stBTC:

```
tb1qav3dse2x7wpf4njp2qd7rfs8qmwq6c27gmtewq6s9jurnlryc0ys7kzv35
```

Alternatively, you can generate your own Babylon-compatible P2WSH address using the provided script:

```zsh
node stake-babylon-p2wsh.js
# Copy the generated address and update BABYLON_WATCH_ADDRESS in relayer/config.js if desired
```

If you need to change any value, simply edit `relayer/config.js`.

### 6. Start the Relayer

In a new terminal, start the relayer:

```zsh
cd relayer
npm start
```

The relayer will not start unless the Ethereum node is running and contracts are deployed.

### 7. Send Testnet BTC to the Watched Address

Use a Bitcoin testnet faucet or wallet to send BTC to your Babylon-compatible P2WSH address.

- Example faucet: https://testnet-faucet.mempool.co/
- If you use the default address, stBTC will be minted to the default configured EVM address.

### 8. Observe stBTC Minting

When the relayer detects a valid deposit, it will automatically trigger the minting of equivalent stBTC to the relayer's Ethereum address on the EVM chain. Monitor the relayer logs for deposit detection and minting events.

---

## Quick Start Summary

```zsh
# 1. Clone and install dependencies
git clone <repository-url>
cd babylon-relayer-project
npm run setup

# 2. Start local Ethereum node
npx hardhat node

# 3. Deploy contracts (in a new terminal)
npx hardhat run scripts/deploy.js --network localhost

# 4. (Optional) Edit relayer/config.js if you want to change any config values or generate a new watch address

# 5. Start the relayer (in a new terminal)
cd relayer && npm start

# 6. Send testnet BTC to your address (default: tb1qav3dse2x7wpf4njp2qd7rfs8qmwq6c27gmtewq6s9jurnlryc0ys7kzv35)
# 7. Watch for stBTC minting on your EVM chain
```

For more details, see comments in `relayer/config.js` and code in `relayer/src/babylonWatcher.js`.

---

# Babylon Relayer Project

A comprehensive Bitcoin-to-EVM bridge implementation with **complete Babylon staking protocol simulation**. This project creates an advanced relayer service that not only monitors Bitcoin staking deposits and mints corresponding stBTC tokens on EVM-compatible networks, but also provides a full simulation of real Babylon staking mechanics including rewards distribution, slashing conditions, delegation management, and voting power calculation.

## Architecture Overview

The system consists of four main components:

1. **Smart Contracts** - EVM contracts for stBTC token management and vault operations
2. **Relayer Service** - Core monitoring and bridging logic with comprehensive staking simulation
3. **Transaction Creator** - Unified utility for creating Babylon-compatible Bitcoin transactions
4. **Staking Protocol Simulation** - Complete implementation of real Babylon staking mechanics

### 🆕 Enhanced Staking Simulation Features

This implementation includes a comprehensive simulation of the Babylon staking protocol:

- **🏛️ Finality Provider Management** - Complete delegation system with commission tracking
- **💰 Rewards Distribution** - Automated staking rewards calculation and distribution
- **⚔️ Slashing Mechanism** - Real-time slashing conditions and penalty enforcement
- **🗳️ Voting Power** - Dynamic voting power calculation based on stake and performance
- **📊 Network Statistics** - Comprehensive network metrics and performance tracking
- **⏰ Epoch Management** - Periodic network state updates and epoch transitions
- **📈 Performance Metrics** - Finality provider reputation, uptime, and performance scoring

## Project Structure

```
babylon-relayer-project/
├── contracts/           # Smart contracts
│   ├── StBTC.sol       # stBTC ERC20 token contract
│   └── Vault.sol       # Vault management contract
├── relayer/            # Core relayer service
│   ├── main.js         # Main relayer service
│   ├── config.js       # Configuration settings
│   └── src/
│       ├── babylonWatcher.js   # Bitcoin transaction monitoring
│       ├── evmTrigger.js      # EVM contract interactions
│       └── utils.js           # Utility functions
├── scripts/            # Deployment scripts
├── test/              # Test files
└── deployments/       # Contract deployment artifacts
```

## How It Works

### 1. Enhanced Transaction Flow

```
Bitcoin Staking → Relayer Detection → Staking Simulation → Validation → EVM Minting
                                        ↓
                              Rewards Distribution → Slashing Checks → Epoch Updates
```

1. **Bitcoin Transaction Creation**: Users create properly formatted Bitcoin staking transactions
2. **Relayer Monitoring**: The relayer service continuously monitors Bitcoin addresses
3. **Staking Position Creation**: Creates comprehensive staking positions with full simulation data
4. **Real-time Simulation**:
   - Tracks delegation to finality providers
   - Calculates and distributes staking rewards
   - Monitors for slashing conditions
   - Updates voting power and network statistics
5. **Transaction Validation**: BabylonWatcher validates transactions meet protocol requirements
6. **Oracle Verification**: Transactions are verified for authenticity and parameters
7. **EVM Minting**: Smart contracts mint corresponding stBTC tokens

### 2. Key Components

- **BabylonWatcher**: Enhanced Bitcoin network monitoring with full staking simulation
- **EVMTrigger**: Handles smart contract interactions and token minting
- **Transaction Creator**: Utility for creating Babylon-compatible transactions
- **Staking Simulation Engine**: Comprehensive implementation of Babylon protocol mechanics

### 3. Staking Protocol Features

#### Finality Provider Management

- **Delegation System**: Complete delegation lifecycle management
- **Commission Tracking**: Automatic commission calculation and distribution
- **Performance Metrics**: Real-time uptime, reputation, and performance scoring
- **Voting Power**: Dynamic calculation based on stake amount, time, and performance

#### Rewards & Economics

- **Automated Distribution**: Hourly rewards distribution to all active stakers
- **Performance-based Rewards**: Rewards adjusted by finality provider performance
- **Commission Structure**: Configurable commission rates per finality provider
- **Network Statistics**: Comprehensive tracking of total staked, rewards, and participants

#### Slashing & Security

- **Real-time Monitoring**: Continuous monitoring for slashing conditions
- **Penalty Enforcement**: Automatic penalty application for misbehavior
- **Reputation Impact**: Slashing events affect finality provider reputation
- **Delegator Protection**: Transparent slashing impact on delegator positions

#### Network Governance

- **Voting Power Calculation**: Based on stake amount, time, and finality provider performance
- **Epoch Management**: Regular network state updates and transitions
- **Network Health**: Monitoring of overall network uptime and performance

### Monitor Staking Activity

The relayer provides detailed real-time logging of all staking activities:

```bash
# Example output:
🏛️ === NEW STAKING POSITION ===
📄 Transaction: a1b2c3d4...
👤 Staker: bc1q...
💰 Amount: 1.50000000 BTC
👥 Finality Provider: Babylon Finality Provider Alpha (fp1)
💸 Commission: 5.0%
📊 Provider Reputation: 95.0%
⚡ Provider Uptime: 99.0%
🗳️ Voting Power: 1,500
📈 Expected Annual Return: 6.0%

💰 === DISTRIBUTING STAKING REWARDS ===
✅ Distributed 0.00012500 BTC in rewards
📊 Total network rewards: 0.00125000 BTC

📊 === BABYLON NETWORK STATUS ===
🕐 Current Epoch: 15
💰 Total Staked: 125.50 BTC
👥 Total Delegators: 42
🏛️ Active Finality Providers: 3
💸 Average Commission: 5.3%
📈 Total Rewards Distributed: 2.1250 BTC
⚔️ Total Slashed: 0.0125 BTC
🌐 Network Uptime: 98.5%
```

## 🆕 Staking Protocol Simulation

### Overview

This implementation provides a complete simulation of the Babylon staking protocol, including all major features that would be present in the actual Babylon network. The simulation runs in real-time alongside the Bitcoin transaction monitoring.

### Simulation Features

#### 1. Finality Provider Network

The simulation includes 3 pre-configured finality providers with realistic parameters:

- **Babylon Finality Provider Alpha (fp1)**

  - Commission: 5.0%
  - Initial Reputation: 95%
  - Target Uptime: 99%
  - Max Delegation: 500 BTC

- **Babylon Finality Provider Beta (fp2)**

  - Commission: 3.0%
  - Initial Reputation: 92%
  - Target Uptime: 97%
  - Max Delegation: 300 BTC

- **Babylon Finality Provider Gamma (fp3)**
  - Commission: 8.0%
  - Initial Reputation: 88%
  - Target Uptime: 95%
  - Max Delegation: 200 BTC

#### 2. Real-time Simulations

**Rewards Distribution (Every Hour)**

- Calculates rewards based on staking amount and time
- Applies finality provider commission
- Adjusts for provider performance (reputation and uptime)
- Distributes rewards to all active staking positions

**Slashing Monitoring (Every 30 Minutes)**

- Simulates realistic slashing conditions
- Higher probability for providers with poor performance
- Applies penalties to both provider and delegators
- Updates reputation scores based on behavior

**Epoch Updates (Every 6 Hours)**

- Updates network-wide statistics
- Recalculates voting power for all participants
- Updates finality provider performance metrics
- Logs comprehensive network status

#### 3. Performance Metrics

The simulation tracks realistic performance metrics:

- **Uptime**: Simulated with natural variation (±1% changes)
- **Reputation**: Long-term metric affected by performance and slashing
- **Voting Power**: Calculated based on stake, reputation, and uptime
- **Commission Earnings**: Tracked per finality provider

#### 4. Monitoring Dashboard

Real-time console output provides comprehensive monitoring:

```bash
🏆 TOP FINALITY PROVIDERS:
   1. Babylon Finality Provider Alpha:
      💰 Delegated: 45.25 BTC
      👥 Delegators: 18
      📊 Reputation: 95.2%
      ⚡ Uptime: 99.1%

📊 === BABYLON NETWORK STATUS ===
🕐 Current Epoch: 15
💰 Total Staked: 125.50 BTC
👥 Total Delegators: 42
🏛️ Active Finality Providers: 3
💸 Average Commission: 5.3%
📈 Total Rewards Distributed: 2.1250 BTC
⚔️ Total Slashed: 0.0125 BTC
🌐 Network Uptime: 98.5%
```

## Smart Contract Deployment

Deploy contracts to your target network:

```bash
# Compile contracts
npx hardhat compile

# Deploy to localhost
npx hardhat run scripts/deploy.js --network localhost

# Deploy to testnet
npx hardhat run scripts/deploy.js --network goerli
```

## Configuration

### Relayer Configuration (`relayer/config.js`)

```javascript
module.exports = {
  bitcoin: {
    network: "testnet", // or 'mainnet'
    rpcUrl: "http://localhost:18332",
    rpcUser: "username",
    rpcPassword: "password",
    confirmationBlocks: 6, // Minimum confirmations for processing
  },
  evm: {
    rpcUrl: "https://goerli.infura.io/v3/YOUR_KEY",
    privateKey: "YOUR_PRIVATE_KEY",
    contractAddress: "0x...",
  },
  monitoring: {
    confirmations: 6,
    pollInterval: 30000, // 30 seconds
  },
  // 🆕 Enhanced Staking Simulation Parameters
  staking: {
    minStakingAmount: 1000000, // 0.01 BTC minimum
    maxStakingAmount: 1000000000000, // 10,000 BTC maximum
    baseRewardRate: 0.06, // 6% annual reward rate
    slashingRate: 0.05, // 5% slashing penalty
    epochDuration: 21600, // 6 hours (simulation)
    unbondingPeriod: 604800, // 7 days
    rewardDistributionInterval: 3600000, // 1 hour
    slashingCheckInterval: 1800000, // 30 minutes
  },
};
```

### Default Configuration Values

The default configuration values are set for development and testing. You can change these values directly in `relayer/config.js`:

```javascript
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
```

## Testing

Run the test suite:

```bash
# Test smart contracts
npx hardhat test

# Test relayer components
cd relayer
npm test
```

## Security Considerations

1. **Private Key Management**: Store private keys securely, never commit to version control
2. **Transaction Validation**: All Bitcoin transactions are validated against Babylon protocol requirements
3. **Confirmation Requirements**: Minimum 6 Bitcoin confirmations before processing
4. **Oracle Verification**: Multiple validation layers prevent invalid minting
5. **Contract Security**: Smart contracts include access controls and reentrancy guards

## Babylon Protocol Integration

This relayer implements **complete Babylon staking protocol simulation** with all major features:

### Core Protocol Features

- **Time-locked Staking**: Bitcoin deposits are time-locked using Babylon's covenant structure
- **Finality Provider Integration**: Complete delegation system with commission tracking
- **Slashing Conditions**: Full implementation of Babylon's slashing mechanism for misbehavior
- **Proof Verification**: Validates Bitcoin transaction proofs for EVM minting

### 🆕 Enhanced Simulation Features

#### Finality Provider Management

- **Multi-Provider Support**: Support for multiple finality providers with individual metrics
- **Performance Tracking**: Real-time monitoring of uptime, reputation, and performance
- **Commission Management**: Configurable commission rates and automatic distribution
- **Voting Power Calculation**: Dynamic voting power based on stake, time, and performance

#### Staking Rewards System

- **Automated Distribution**: Hourly rewards distribution to all active stakers
- **Performance-based Multipliers**: Rewards adjusted by finality provider performance
- **Commission Deduction**: Automatic commission calculation and distribution
- **Compound Growth**: Rewards accumulate and compound over time

#### Slashing Mechanism

- **Behavior Monitoring**: Continuous monitoring for finality provider misbehavior
- **Automatic Penalties**: Real-time slashing execution with configurable severity
- **Reputation Impact**: Slashing events permanently affect provider reputation
- **Delegator Notification**: Complete transparency of slashing impact on positions

#### Network Statistics

- **Real-time Metrics**: Total staked, active delegators, rewards distributed
- **Performance Analytics**: Network uptime, average commission, slashing statistics
- **Epoch Management**: Regular network state updates and transitions
- **Historical Tracking**: Complete audit trail of all staking activities

### Supported Slashing Conditions

- **Double Signing**: Detection and penalty for conflicting signatures
- **Unavailability**: Penalties for extended downtime or missed attestations
- **Byzantine Behavior**: Penalties for malicious or incorrect behavior
- **Missed Blocks**: Penalties for failing to participate in consensus

### Economic Parameters (Configurable)

- **Base Reward Rate**: 6% annual return (adjustable)
- **Slashing Penalties**: 5% for major infractions, 2.5% for minor
- **Commission Range**: 3-8% per finality provider
- **Minimum Stake**: 0.01 BTC
- **Unbonding Period**: 7 days

## API Reference

### Relayer Events

The enhanced relayer emits comprehensive events for monitoring:

#### Transaction Events

- `transaction.detected` - New Bitcoin transaction found
- `transaction.confirmed` - Transaction reached required confirmations
- `transaction.validated` - Transaction passed Babylon validation
- `minting.initiated` - EVM minting process started
- `minting.completed` - stBTC tokens minted successfully

#### 🆕 Staking Protocol Events

- `babylonStaking` - New staking position created with full simulation data
- `rewardsDistributed` - Staking rewards distributed to delegators
- `slashingExecuted` - Slashing penalty applied to finality provider
- `epochUpdate` - Network epoch transition with updated statistics

#### Event Data Examples

```javascript
// Staking Event
{
  type: 'delegation_created',
  stakingPosition: {
    txHash: 'a1b2c3d4...',
    stakerAddress: 'bc1q...',
    amount: 150000000, // satoshis
    finalityProvider: 'fp1',
    votingPower: 1500,
    rewards: { annualRate: 0.06 }
  },
  networkStats: {
    totalStaked: 12550000000,
    totalDelegators: 42,
    activeFinality: 3
  }
}

// Rewards Event
{
  amount: 12500000, // satoshis
  recipientCount: 42,
  timestamp: 1643723400
}

// Slashing Event
{
  finalityProvider: 'fp2',
  amount: 1250000, // satoshis slashed
  reason: 'double_sign',
  severity: 'major',
  affectedDelegators: 15
}
```

## Troubleshooting

### Common Issues

#### General Issues

1. **Connection Errors**: Check Bitcoin/EVM RPC configurations
2. **Transaction Not Detected**: Verify transaction format meets Babylon requirements
3. **Minting Failures**: Check EVM private key and contract permissions
4. **Confirmation Delays**: Bitcoin confirmations may take time during network congestion

#### 🆕 Staking Simulation Issues

5. **Rewards Not Distributing**: Check if staking simulation is enabled and intervals are configured
6. **Slashing Events Too Frequent**: Adjust slashing probability in simulation parameters
7. **Performance Metrics Not Updating**: Verify epoch update intervals are running
8. **Finality Provider Issues**: Check if providers are properly initialized with valid parameters

### Debug Mode

Enable comprehensive debug logging for both relayer and simulation:

```bash
cd relayer
DEBUG=* npm start
```

### Staking Simulation Logs

Monitor specific staking simulation activities:

```bash
# Filter for staking-related logs
cd relayer
npm start | grep -E "(STAKING|REWARDS|SLASHING|EPOCH)"

# Example filtered output:
🏛️ === PROCESSING BABYLON STAKING DEPOSIT ===
💰 === DISTRIBUTING STAKING REWARDS ===
⚔️ === CHECKING SLASHING CONDITIONS ===
🕐 === EPOCH 15 UPDATE ===
```
