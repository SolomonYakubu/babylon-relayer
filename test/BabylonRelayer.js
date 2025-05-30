const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Babylon Relayer Contracts", function () {
  let stBTC, vault, owner, addr1, addr2;
  let stBTCAddress, vaultAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

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
  });

  describe("StBTC Token", function () {
    it("Should have correct name and symbol", async function () {
      expect(await stBTC.name()).to.equal("Staked Bitcoin");
      expect(await stBTC.symbol()).to.equal("stBTC");
    });

    it("Should allow authorized addresses to mint", async function () {
      const amount = ethers.parseEther("1");
      await stBTC.mint(addr1.address, amount);
      expect(await stBTC.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should not allow unauthorized addresses to mint", async function () {
      const amount = ethers.parseEther("1");
      await expect(
        stBTC.connect(addr1).mint(addr1.address, amount)
      ).to.be.revertedWith("Not authorized");
    });
  });
  describe("Vault Contract", function () {
    it("Should register Babylon deposits", async function () {
      const txHash =
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const amount = ethers.parseUnits("50000000", 0); // 0.5 BTC in satoshis
      const unlockTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      const finalityProvider = "fp1";

      await vault.registerBabylonDeposit(
        txHash,
        addr1.address,
        amount,
        unlockTime,
        finalityProvider
      );

      const deposit = await vault.getDeposit(txHash);
      expect(deposit.user).to.equal(addr1.address);
      expect(deposit.amount).to.equal(amount);
      expect(deposit.unlockTime).to.equal(unlockTime);
      expect(deposit.finalityProvider).to.equal(finalityProvider);
      expect(deposit.processed).to.be.false;
    });

    it("Should mint stBTC for Babylon deposits", async function () {
      const txHash =
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const amount = ethers.parseUnits("50000000", 0); // 0.5 BTC in satoshis
      const unlockTime = Math.floor(Date.now() / 1000) + 86400;
      const finalityProvider = "fp1";
      const expectedTokenAmount = amount * BigInt(10 ** 10); // Convert to 18 decimals

      // Register Babylon deposit
      await vault.registerBabylonDeposit(
        txHash,
        addr1.address,
        amount,
        unlockTime,
        finalityProvider
      );

      // Mint stBTC
      await vault.mintStBTC(txHash);

      // Check that stBTC was minted (converts satoshis to 18-decimal tokens)
      expect(await stBTC.balanceOf(addr1.address)).to.equal(
        expectedTokenAmount
      );

      // Check that deposit is marked as processed
      const deposit = await vault.getDeposit(txHash);
      expect(deposit.processed).to.be.true;
    });

    it("Should handle withdrawal requests", async function () {
      const txHash =
        "withdrawal123456789abcdef1234567890abcdef1234567890abcdef1234567890";
      const amount = ethers.parseUnits("50000000", 0); // 0.5 BTC in satoshis
      const unlockTime = Math.floor(Date.now() / 1000) + 86400;
      const finalityProvider = "fp1";
      const expectedTokenAmount = amount * BigInt(10 ** 10); // Convert to 18 decimals

      // First register and process a Babylon deposit to establish userBalance
      await vault.registerBabylonDeposit(
        txHash,
        addr1.address,
        amount,
        unlockTime,
        finalityProvider
      );
      await vault.mintStBTC(txHash);

      // Verify stBTC was minted and userBalance was set
      expect(await stBTC.balanceOf(addr1.address)).to.equal(
        expectedTokenAmount
      );

      // Request withdrawal
      await vault
        .connect(addr1)
        .requestWithdrawal(expectedTokenAmount, "bc1qexampleaddress");

      // Check that stBTC was burned
      expect(await stBTC.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should reject duplicate Babylon deposits", async function () {
      const txHash =
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const amount = ethers.parseUnits("50000000", 0); // 0.5 BTC in satoshis
      const unlockTime = Math.floor(Date.now() / 1000) + 86400;
      const finalityProvider = "fp1";

      await vault.registerBabylonDeposit(
        txHash,
        addr1.address,
        amount,
        unlockTime,
        finalityProvider
      );

      await expect(
        vault.registerBabylonDeposit(
          txHash,
          addr1.address,
          amount,
          unlockTime,
          finalityProvider
        )
      ).to.be.revertedWith("Deposit already registered");
    });

    it("Should reject minting for non-existent deposits", async function () {
      const txHash =
        "nonexistent1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

      await expect(vault.mintStBTC(txHash)).to.be.revertedWith(
        "Deposit not registered"
      );
    });
  });
});
