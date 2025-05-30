const { expect } = require("chai");
const BabylonWatcher = require("../relayer/src/babylonWatcher");
const config = require("../relayer/config");

describe("Babylon Staking Simulation", function () {
  let babylonWatcher;
  let mockEvmTrigger;

  beforeEach(function () {
    // Mock EVMTrigger for testing
    mockEvmTrigger = {
      events: {},
      emit: function (eventName, data) {
        if (this.events[eventName]) {
          this.events[eventName].forEach((callback) => callback(data));
        }
      },
      on: function (eventName, callback) {
        if (!this.events[eventName]) {
          this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
      },
    };

    babylonWatcher = new BabylonWatcher(mockEvmTrigger);
  });

  describe("Finality Provider Management", function () {
    it("Should initialize with default finality providers", function () {
      expect(babylonWatcher.finalityProviders).to.have.property("fp1");
      expect(babylonWatcher.finalityProviders).to.have.property("fp2");
      expect(babylonWatcher.finalityProviders).to.have.property("fp3");

      const fp1 = babylonWatcher.finalityProviders.fp1;
      expect(fp1.name).to.equal("Babylon Finality Provider Alpha");
      expect(fp1.commission).to.equal(0.05);
      expect(fp1.reputation).to.equal(95.0);
    });

    it("Should calculate voting power correctly", function () {
      const amount = 100000000; // 1 BTC in satoshis
      const provider = babylonWatcher.finalityProviders.fp1;

      const votingPower = babylonWatcher.calculateVotingPower(amount, provider);

      // Expected: (amount / 100000000) * reputation * uptime * 1000
      const expected =
        (amount / 100000000) *
        (provider.reputation / 100) *
        (provider.uptime / 100) *
        1000;
      expect(votingPower).to.be.closeTo(expected, 1);
    });

    it("Should update provider performance metrics", function () {
      const initialUptime = babylonWatcher.finalityProviders.fp1.uptime;

      babylonWatcher.updateProviderPerformance();

      const newUptime = babylonWatcher.finalityProviders.fp1.uptime;
      expect(newUptime).to.not.equal(initialUptime);
      expect(newUptime).to.be.at.least(90); // Should stay within reasonable bounds
      expect(newUptime).to.be.at.most(100);
    });
  });

  describe("Staking Position Management", function () {
    it("Should create staking position with correct parameters", function () {
      const mockTx = {
        txid: "test_tx_123",
        vout: [
          {
            value: 100000000, // 1 BTC
            scriptPubKey: { addresses: ["bc1qtest"] },
          },
        ],
      };

      const finalityProvider = "fp1";

      const position = babylonWatcher.createStakingPosition(
        mockTx,
        finalityProvider
      );

      expect(position.txHash).to.equal("test_tx_123");
      expect(position.amount).to.equal(100000000);
      expect(position.finalityProvider).to.equal("fp1");
      expect(position.votingPower).to.be.greaterThan(0);
      expect(position.rewards.accumulated).to.equal(0);
    });

    it("Should track staking positions correctly", function () {
      const initialCount = Object.keys(babylonWatcher.activeStakers).length;

      const mockTx = {
        txid: "test_tx_456",
        vout: [
          {
            value: 50000000, // 0.5 BTC
            scriptPubKey: { addresses: ["bc1qtest2"] },
          },
        ],
      };

      babylonWatcher.createStakingPosition(mockTx, "fp2");

      const newCount = Object.keys(babylonWatcher.activeStakers).length;
      expect(newCount).to.equal(initialCount + 1);
      expect(babylonWatcher.activeStakers["test_tx_456"]).to.exist;
    });
  });

  describe("Rewards Distribution", function () {
    beforeEach(function () {
      // Create test staking positions
      const mockTx1 = {
        txid: "reward_test_1",
        vout: [
          {
            value: 100000000, // 1 BTC
            scriptPubKey: { addresses: ["bc1qtest1"] },
          },
        ],
      };

      const mockTx2 = {
        txid: "reward_test_2",
        vout: [
          {
            value: 200000000, // 2 BTC
            scriptPubKey: { addresses: ["bc1qtest2"] },
          },
        ],
      };

      babylonWatcher.createStakingPosition(mockTx1, "fp1");
      babylonWatcher.createStakingPosition(mockTx2, "fp2");
    });

    it("Should calculate rewards correctly", function () {
      const position = babylonWatcher.activeStakers["reward_test_1"];
      const currentTime = Date.now();

      // Simulate 1 hour of staking
      position.timestamp = currentTime - 3600000;

      const rewards = babylonWatcher.calculateRewards(position);

      expect(rewards).to.be.greaterThan(0);
      // Should be approximately: (amount * rate * time) / (365.25 * 24 * 3600 * 1000)
      const expectedRewards =
        (position.amount * config.staking.baseRewardRate * 3600000) /
        (365.25 * 24 * 3600 * 1000);
      expect(rewards).to.be.closeTo(expectedRewards, expectedRewards * 0.1); // Within 10%
    });

    it("Should distribute rewards to all active stakers", function () {
      // Simulate some time has passed for reward accumulation
      const currentTime = Date.now();
      babylonWatcher.activeStakers["reward_test_1"].timestamp =
        currentTime - 3600000; // 1 hour ago
      babylonWatcher.activeStakers["reward_test_2"].timestamp =
        currentTime - 3600000; // 1 hour ago

      const initialReward1 =
        babylonWatcher.activeStakers["reward_test_1"].rewards.accumulated;
      const initialReward2 =
        babylonWatcher.activeStakers["reward_test_2"].rewards.accumulated;

      babylonWatcher.distributeStakingRewards();

      const finalReward1 =
        babylonWatcher.activeStakers["reward_test_1"].rewards.accumulated;
      const finalReward2 =
        babylonWatcher.activeStakers["reward_test_2"].rewards.accumulated;

      expect(finalReward1).to.be.greaterThan(initialReward1);
      expect(finalReward2).to.be.greaterThan(initialReward2);
    });

    it("Should apply commission correctly", function () {
      // Simulate some time has passed for reward accumulation
      const currentTime = Date.now();
      babylonWatcher.activeStakers["reward_test_1"].timestamp =
        currentTime - 3600000; // 1 hour ago

      const position = babylonWatcher.activeStakers["reward_test_1"];
      const provider =
        babylonWatcher.finalityProviders[position.finalityProvider];
      const initialCommissionEarned = provider.commissionEarned;

      babylonWatcher.distributeStakingRewards();

      const finalCommissionEarned = provider.commissionEarned;
      expect(finalCommissionEarned).to.be.greaterThan(initialCommissionEarned);
    });
  });

  describe("Slashing Mechanism", function () {
    beforeEach(function () {
      // Create test staking position
      const mockTx = {
        txid: "slashing_test_1",
        vout: [
          {
            value: 100000000, // 1 BTC
            scriptPubKey: { addresses: ["bc1qslash"] },
          },
        ],
      };

      babylonWatcher.createStakingPosition(mockTx, "fp1");
    });

    it("Should apply slashing penalties correctly", function () {
      const initialAmount =
        babylonWatcher.activeStakers["slashing_test_1"].amount;
      const provider = babylonWatcher.finalityProviders.fp1;
      const initialReputation = provider.reputation;

      // Force a slashing event
      babylonWatcher.executeSlashing("fp1", "double_sign");

      const finalAmount =
        babylonWatcher.activeStakers["slashing_test_1"].amount;
      const finalReputation = provider.reputation;

      expect(finalAmount).to.be.lessThan(initialAmount);
      expect(finalReputation).to.be.lessThan(initialReputation);
    });

    it("Should track slashing statistics", function () {
      const initialSlashed = babylonWatcher.networkStats.totalSlashed;

      babylonWatcher.executeSlashing("fp1", "unavailability");

      const finalSlashed = babylonWatcher.networkStats.totalSlashed;
      expect(finalSlashed).to.be.greaterThan(initialSlashed);
    });
  });

  describe("Network Statistics", function () {
    it("Should update network statistics correctly", function () {
      const mockTx = {
        txid: "stats_test_1",
        vout: [
          {
            value: 300000000, // 3 BTC
            scriptPubKey: { addresses: ["bc1qstats"] },
          },
        ],
      };

      const initialStaked = babylonWatcher.networkStats.totalStaked;
      const initialDelegators = babylonWatcher.networkStats.totalDelegators;

      babylonWatcher.createStakingPosition(mockTx, "fp3");
      babylonWatcher.updateNetworkStats();

      const finalStaked = babylonWatcher.networkStats.totalStaked;
      const finalDelegators = babylonWatcher.networkStats.totalDelegators;

      expect(finalStaked).to.be.greaterThan(initialStaked);
      expect(finalDelegators).to.be.greaterThan(initialDelegators);
    });

    it("Should calculate network uptime correctly", function () {
      babylonWatcher.updateNetworkStats();

      const networkUptime = babylonWatcher.networkStats.networkUptime;
      expect(networkUptime).to.be.at.least(0);
      expect(networkUptime).to.be.at.most(100);
    });
  });

  describe("Epoch Management", function () {
    it("Should increment epoch correctly", function () {
      const initialEpoch = babylonWatcher.currentEpoch;

      babylonWatcher.updateEpoch();

      const finalEpoch = babylonWatcher.currentEpoch;
      expect(finalEpoch).to.equal(initialEpoch + 1);
    });

    it("Should update all metrics during epoch transition", function () {
      // Create some test data
      const mockTx = {
        txid: "epoch_test_1",
        vout: [
          {
            value: 100000000,
            scriptPubKey: { addresses: ["bc1qepoch"] },
          },
        ],
      };

      babylonWatcher.createStakingPosition(mockTx, "fp1");

      const initialEpoch = babylonWatcher.currentEpoch;
      const initialUptime = babylonWatcher.finalityProviders.fp1.uptime;

      babylonWatcher.updateEpoch();

      const finalEpoch = babylonWatcher.currentEpoch;
      const finalUptime = babylonWatcher.finalityProviders.fp1.uptime;

      expect(finalEpoch).to.equal(initialEpoch + 1);
      // Performance metrics should be updated
      expect(finalUptime).to.not.equal(initialUptime);
    });
  });

  describe("Configuration Integration", function () {
    it("Should respect staking configuration limits", function () {
      const minAmount = config.staking.minStakingAmount;
      const maxAmount = config.staking.maxStakingAmount;

      // Test minimum amount validation
      const smallTx = {
        txid: "small_test",
        vout: [
          {
            value: minAmount - 1,
            scriptPubKey: { addresses: ["bc1qsmall"] },
          },
        ],
      };

      const position = babylonWatcher.createStakingPosition(smallTx, "fp1");
      expect(position).to.be.null; // Should reject below minimum
    });

    it("Should use correct reward rate from config", function () {
      const position = {
        amount: 100000000,
        timestamp: Date.now() - 3600000, // 1 hour ago
        finalityProvider: "fp1",
      };

      const rewards = babylonWatcher.calculateRewards(position);

      // Verify it uses the base reward rate from config
      const expectedRate = config.staking.baseRewardRate;
      const calculatedRate = (rewards * 365.25 * 24) / position.amount; // Annualized rate

      expect(calculatedRate).to.be.closeTo(expectedRate, expectedRate * 0.2); // Within 20%
    });
  });
});
