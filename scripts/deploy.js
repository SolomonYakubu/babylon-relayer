const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying Babylon Relayer contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", await deployer.getAddress());

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy StBTC contract
  console.log("\nDeploying StBTC contract...");
  const StBTC = await ethers.getContractFactory("StBTC");
  const stBTC = await StBTC.deploy();
  await stBTC.waitForDeployment();
  console.log("StBTC deployed to:", await stBTC.getAddress());

  // Deploy Vault contract
  console.log("\nDeploying Vault contract...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(await stBTC.getAddress());
  await vault.waitForDeployment();
  console.log("Vault deployed to:", await vault.getAddress());

  // Authorize vault to mint/burn stBTC
  console.log("\nAuthorizing Vault to mint/burn stBTC...");
  const authTx = await stBTC.addAuthorized(await vault.getAddress());
  await authTx.wait();
  console.log("Vault authorized successfully");

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    stBTC: await stBTC.getAddress(),
    vault: await vault.getAddress(),
    deployer: await deployer.getAddress(),
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Generate ABI for relayer
  const vaultABI = JSON.stringify(vault.interface.formatJson(), null, 2);
  const relayerDir = path.join(__dirname, "../relayer");
  fs.writeFileSync(path.join(relayerDir, "vaultABI.json"), vaultABI);

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("StBTC:", await stBTC.getAddress());
  console.log("Vault:", await vault.getAddress());
  console.log("Deployer:", await deployer.getAddress());
  console.log("ABI saved to relayer/vaultABI.json");
  console.log("Deployment info saved to deployments/" + hre.network.name + ".json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
