const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Babylon Vault Contract - Comprehensive Tests", function () {
  let stBTC, vault, owner, addr1, addr2, relayer;
  let stBTCAddress, vaultAddress;

  beforeEach(async function () {
    [owner, addr1, addr2, relayer] = await ethers.getSigners();

    // Deploy StBTC
    const StBTC = await ethers.getContractFactory("StBTC");
    stBTC = await StBTC.deploy();
    await stBTC.waitForDeployment();
    stBTCAddress = await stBTC.getAddress();

    // Deploy Vault
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(stBTCAddress);
    await vault.waitForDeployment();
    vaultAddress = await vault.getAddress();

    // Authorize vault to mint/burn stBTC
    await stBTC.addAuthorized(vaultAddress);

    // Transfer ownership to relayer for testing
    await vault.transferOwnership(relayer.address);
  });

  describe("Contract Initialization", function () {
    it("Should set correct stBTC address", async function () {
      expect(await vault.stBTC()).to.equal(stBTCAddress);
    });

    it("Should authorize default finality providers", async function () {
      expect(await vault.authorizedFinalityProviders("fp1")).to.be.true;
      expect(await vault.authorizedFinalityProviders("fp2")).to.be.true;
    });

    it("Should set minimum confirmations to 6", async function () {
      expect(await vault.MINIMUM_CONFIRMATIONS()).to.equal(6);
    });
  });

  describe("Babylon Deposit Registration", function () {
    const btcTxHash =
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const amount = ethers.parseUnits("1", 8); // 1 BTC in satoshis
    const unlockTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
    const finalityProvider = "fp1";

    it("Should register a valid Babylon deposit", async function () {
      await expect(
        vault
          .connect(relayer)
          .registerBabylonDeposit(
            btcTxHash,
            addr1.address,
            amount,
            unlockTime,
            finalityProvider
          )
      ).to.emit(vault, "DepositRegistered");

      // Check deposit was stored correctly
      const deposit = await vault.getDeposit(btcTxHash);
      expect(deposit.user).to.equal(addr1.address);
      expect(deposit.amount).to.equal(amount);
      expect(deposit.unlockTime).to.equal(unlockTime);
      expect(deposit.finalityProvider).to.equal(finalityProvider);
      expect(deposit.processed).to.be.false;
    });

    it("Should fail with invalid parameters", async function () {
      // Invalid transaction hash
      await expect(
        vault
          .connect(relayer)
          .registerBabylonDeposit(
            "",
            addr1.address,
            amount,
            unlockTime,
            finalityProvider
          )
      ).to.be.revertedWith("Invalid transaction hash");

      // Invalid user address
      await expect(
        vault
          .connect(relayer)
          .registerBabylonDeposit(
            btcTxHash,
            ethers.ZeroAddress,
            amount,
            unlockTime,
            finalityProvider
          )
      ).to.be.revertedWith("Invalid user address");

      // Zero amount
      await expect(
        vault
          .connect(relayer)
          .registerBabylonDeposit(
            btcTxHash,
            addr1.address,
            0,
            unlockTime,
            finalityProvider
          )
      ).to.be.revertedWith("Amount must be greater than 0");

      // Past unlock time
      const pastTime = Math.floor(Date.now() / 1000) - 86400;
      await expect(
        vault
          .connect(relayer)
          .registerBabylonDeposit(
            btcTxHash,
            addr1.address,
            amount,
            pastTime,
            finalityProvider
          )
      ).to.be.revertedWith("Unlock time must be in future");

      // Unauthorized finality provider
      await expect(
        vault
          .connect(relayer)
          .registerBabylonDeposit(
            btcTxHash,
            addr1.address,
            amount,
            unlockTime,
            "unauthorized"
          )
      ).to.be.revertedWith("Unauthorized finality provider");
    });

    it("Should fail if not called by relayer", async function () {
      await expect(
        vault
          .connect(addr1)
          .registerBabylonDeposit(
            btcTxHash,
            addr1.address,
            amount,
            unlockTime,
            finalityProvider
          )
      ).to.be.revertedWith("Only relayer can call");
    });

    it("Should fail for duplicate deposits", async function () {
      // Register first deposit
      await vault
        .connect(relayer)
        .registerBabylonDeposit(
          btcTxHash,
          addr1.address,
          amount,
          unlockTime,
          finalityProvider
        );

      // Try to register same deposit again
      await expect(
        vault
          .connect(relayer)
          .registerBabylonDeposit(
            btcTxHash,
            addr1.address,
            amount,
            unlockTime,
            finalityProvider
          )
      ).to.be.revertedWith("Deposit already registered");
    });
  });

  describe("stBTC Minting", function () {
    const btcTxHash =
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const amount = ethers.parseUnits("1", 8); // 1 BTC in satoshis
    const unlockTime = Math.floor(Date.now() / 1000) + 86400;
    const finalityProvider = "fp1";

    beforeEach(async function () {
      // Register deposit first
      await vault
        .connect(relayer)
        .registerBabylonDeposit(
          btcTxHash,
          addr1.address,
          amount,
          unlockTime,
          finalityProvider
        );
    });

    it("Should mint stBTC for registered deposit", async function () {
      const expectedTokenAmount = amount * BigInt(10 ** 10); // Convert 8 decimals to 18 decimals

      await expect(vault.connect(relayer).mintStBTC(btcTxHash)).to.emit(
        vault,
        "StBTCMinted"
      );

      // Check balances
      expect(await stBTC.balanceOf(addr1.address)).to.equal(
        expectedTokenAmount
      );
      expect(await vault.userBalances(addr1.address)).to.equal(
        expectedTokenAmount
      );
      expect(await vault.totalDeposits()).to.equal(expectedTokenAmount);

      // Check deposit status
      const deposit = await vault.getDeposit(btcTxHash);
      expect(deposit.processed).to.be.true;
    });

    it("Should fail for unregistered deposit", async function () {
      const unregisteredHash =
        "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
      await expect(
        vault.connect(relayer).mintStBTC(unregisteredHash)
      ).to.be.revertedWith("Deposit not registered");
    });

    it("Should fail for already processed deposit", async function () {
      // Process deposit first time
      await vault.connect(relayer).mintStBTC(btcTxHash);

      // Try to process again
      await expect(
        vault.connect(relayer).mintStBTC(btcTxHash)
      ).to.be.revertedWith("Deposit already processed");
    });

    it("Should fail if not called by relayer", async function () {
      await expect(
        vault.connect(addr1).mintStBTC(btcTxHash)
      ).to.be.revertedWith("Only relayer can call");
    });
  });

  describe("Finality Provider Management", function () {
    it("Should authorize new finality provider", async function () {
      const newProvider = "fp3";

      await expect(
        vault.connect(relayer).authorizeFinalityProvider(newProvider)
      )
        .to.emit(vault, "FinalityProviderAuthorized")
        .withArgs(newProvider);

      expect(await vault.isFinalityProviderAuthorized(newProvider)).to.be.true;
    });

    it("Should deauthorize finality provider", async function () {
      const provider = "fp1";

      await expect(vault.connect(relayer).deauthorizeFinalityProvider(provider))
        .to.emit(vault, "FinalityProviderDeauthorized")
        .withArgs(provider);

      expect(await vault.isFinalityProviderAuthorized(provider)).to.be.false;
    });

    it("Should fail if not called by owner", async function () {
      await expect(
        vault.connect(addr1).authorizeFinalityProvider("fp3")
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        vault.connect(addr1).deauthorizeFinalityProvider("fp1")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Withdrawal Functionality", function () {
    const btcTxHash =
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const amount = ethers.parseUnits("1", 8);
    const unlockTime = Math.floor(Date.now() / 1000) + 86400;
    const finalityProvider = "fp1";
    const btcAddress = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";

    beforeEach(async function () {
      // Register and process deposit to have stBTC balance
      await vault
        .connect(relayer)
        .registerBabylonDeposit(
          btcTxHash,
          addr1.address,
          amount,
          unlockTime,
          finalityProvider
        );
      await vault.connect(relayer).mintStBTC(btcTxHash);
    });

    it("Should allow withdrawal of stBTC", async function () {
      const withdrawAmount = ethers.parseUnits("0.5", 18); // 0.5 stBTC

      await expect(
        vault.connect(addr1).requestWithdrawal(withdrawAmount, btcAddress)
      )
        .to.emit(vault, "WithdrawalRequested")
        .withArgs(addr1.address, withdrawAmount, btcAddress);

      // Check balances updated
      const expectedBalance = ethers.parseUnits("0.5", 18); // Remaining 0.5 stBTC
      expect(await stBTC.balanceOf(addr1.address)).to.equal(expectedBalance);
      expect(await vault.userBalances(addr1.address)).to.equal(expectedBalance);
    });

    it("Should fail with insufficient balance", async function () {
      const largeAmount = ethers.parseUnits("2", 18); // More than available

      await expect(
        vault.connect(addr1).requestWithdrawal(largeAmount, btcAddress)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should fail with invalid parameters", async function () {
      const withdrawAmount = ethers.parseUnits("0.5", 18);

      // Zero amount
      await expect(
        vault.connect(addr1).requestWithdrawal(0, btcAddress)
      ).to.be.revertedWith("Invalid amount");

      // Empty Bitcoin address
      await expect(
        vault.connect(addr1).requestWithdrawal(withdrawAmount, "")
      ).to.be.revertedWith("Invalid Bitcoin address");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause and unpause", async function () {
      await vault.connect(relayer).pause();
      expect(await vault.paused()).to.be.true;

      await vault.connect(relayer).unpause();
      expect(await vault.paused()).to.be.false;
    });

    it("Should prevent operations when paused", async function () {
      await vault.connect(relayer).pause();

      const btcTxHash =
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const amount = ethers.parseUnits("1", 8);
      const unlockTime = Math.floor(Date.now() / 1000) + 86400;
      const finalityProvider = "fp1";

      await expect(
        vault
          .connect(relayer)
          .registerBabylonDeposit(
            btcTxHash,
            addr1.address,
            amount,
            unlockTime,
            finalityProvider
          )
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete deposit flow", async function () {
      const btcTxHash =
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const amount = ethers.parseUnits("2.5", 8); // 2.5 BTC
      const unlockTime = Math.floor(Date.now() / 1000) + 86400;
      const finalityProvider = "fp1";
      const expectedTokenAmount = amount * BigInt(10 ** 10);

      // 1. Register deposit
      await vault
        .connect(relayer)
        .registerBabylonDeposit(
          btcTxHash,
          addr1.address,
          amount,
          unlockTime,
          finalityProvider
        );

      // 2. Mint stBTC
      await vault.connect(relayer).mintStBTC(btcTxHash);

      // 3. Verify balances
      expect(await stBTC.balanceOf(addr1.address)).to.equal(
        expectedTokenAmount
      );
      expect(await vault.userBalances(addr1.address)).to.equal(
        expectedTokenAmount
      );
      expect(await vault.totalDeposits()).to.equal(expectedTokenAmount);

      // 4. Partial withdrawal
      const withdrawAmount = ethers.parseUnits("1", 18); // 1 stBTC
      await vault
        .connect(addr1)
        .requestWithdrawal(
          withdrawAmount,
          "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
        );

      // 5. Verify final balances
      const finalBalance = expectedTokenAmount - withdrawAmount;
      expect(await stBTC.balanceOf(addr1.address)).to.equal(finalBalance);
      expect(await vault.userBalances(addr1.address)).to.equal(finalBalance);
    });

    it("Should handle multiple deposits from different users", async function () {
      const deposits = [
        {
          hash: "0x1111111111111111111111111111111111111111111111111111111111111111",
          user: addr1.address,
          amount: ethers.parseUnits("1", 8),
        },
        {
          hash: "0x2222222222222222222222222222222222222222222222222222222222222222",
          user: addr2.address,
          amount: ethers.parseUnits("0.5", 8),
        },
      ];

      const unlockTime = Math.floor(Date.now() / 1000) + 86400;
      const finalityProvider = "fp1";

      for (const deposit of deposits) {
        // Register and process each deposit
        await vault
          .connect(relayer)
          .registerBabylonDeposit(
            deposit.hash,
            deposit.user,
            deposit.amount,
            unlockTime,
            finalityProvider
          );
        await vault.connect(relayer).mintStBTC(deposit.hash);

        // Verify individual balance
        const expectedBalance = deposit.amount * BigInt(10 ** 10);
        expect(await stBTC.balanceOf(deposit.user)).to.equal(expectedBalance);
      }

      // Verify total deposits
      const totalExpected = deposits.reduce(
        (sum, d) => sum + d.amount * BigInt(10 ** 10),
        BigInt(0)
      );
      expect(await vault.totalDeposits()).to.equal(totalExpected);
    });
  });
});
