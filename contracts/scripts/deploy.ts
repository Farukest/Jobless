import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Jobless Ecosystem Contracts to Base Network...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy JoblessToken
  console.log("\n1. Deploying JoblessToken...");
  const JoblessToken = await ethers.getContractFactory("JoblessToken");
  const token = await JoblessToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("JoblessToken deployed to:", tokenAddress);

  // Deploy RewardDistributor
  console.log("\n2. Deploying RewardDistributor...");
  const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
  const distributor = await RewardDistributor.deploy(tokenAddress, deployer.address);
  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();
  console.log("RewardDistributor deployed to:", distributorAddress);

  // Grant MINTER_ROLE to RewardDistributor
  console.log("\n3. Granting MINTER_ROLE to RewardDistributor...");
  const MINTER_ROLE = await token.MINTER_ROLE();
  const tx = await token.grantRole(MINTER_ROLE, distributorAddress);
  await tx.wait();
  console.log("MINTER_ROLE granted to RewardDistributor");

  // Transfer tokens to RewardDistributor for initial distribution
  console.log("\n4. Transferring tokens to RewardDistributor...");
  const initialAmount = ethers.parseEther("10000000"); // 10M tokens
  const transferTx = await token.transfer(distributorAddress, initialAmount);
  await transferTx.wait();
  console.log("Transferred", ethers.formatEther(initialAmount), "tokens to RewardDistributor");

  console.log("\n=== Deployment Summary ===");
  console.log("JoblessToken:", tokenAddress);
  console.log("RewardDistributor:", distributorAddress);
  console.log("\nSave these addresses to your .env file:");
  console.log(`TOKEN_CONTRACT_ADDRESS=${tokenAddress}`);
  console.log(`DISTRIBUTION_CONTRACT_ADDRESS=${distributorAddress}`);

  // Verification instructions
  console.log("\n=== Verification Commands ===");
  console.log(`npx hardhat verify --network base-mainnet ${tokenAddress} "${deployer.address}"`);
  console.log(`npx hardhat verify --network base-mainnet ${distributorAddress} "${tokenAddress}" "${deployer.address}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
