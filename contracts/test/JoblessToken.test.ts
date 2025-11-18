import { expect } from "chai";
import { ethers } from "hardhat";
import { JoblessToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("JoblessToken", function () {
  let token: JoblessToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const JoblessToken = await ethers.getContractFactory("JoblessToken");
    token = await JoblessToken.deploy(owner.address);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await token.name()).to.equal("Jobless Token");
      expect(await token.symbol()).to.equal("JOB");
    });

    it("Should mint initial supply to deployer", async function () {
      const initialSupply = ethers.parseEther("100000000");
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("Should set the correct max supply", async function () {
      const maxSupply = ethers.parseEther("1000000000");
      expect(await token.MAX_SUPPLY()).to.equal(maxSupply);
    });

    it("Should grant roles to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      const PAUSER_ROLE = await token.PAUSER_ROLE();
      const MINTER_ROLE = await token.MINTER_ROLE();

      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await token.mint(addr1.address, mintAmount, "Test mint");
      expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should not allow minting beyond max supply", async function () {
      const currentSupply = await token.totalSupply();
      const maxSupply = await token.MAX_SUPPLY();
      const exceedAmount = maxSupply - currentSupply + BigInt(1);

      await expect(
        token.mint(addr1.address, exceedAmount, "Exceed max supply")
      ).to.be.revertedWith("JoblessToken: Max supply exceeded");
    });

    it("Should not allow non-minter to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        token.connect(addr1).mint(addr2.address, mintAmount, "Unauthorized mint")
      ).to.be.reverted;
    });

    it("Should batch mint to multiple addresses", async function () {
      const recipients = [addr1.address, addr2.address];
      const amounts = [ethers.parseEther("100"), ethers.parseEther("200")];

      await token.batchMint(recipients, amounts);

      expect(await token.balanceOf(addr1.address)).to.equal(amounts[0]);
      expect(await token.balanceOf(addr2.address)).to.equal(amounts[1]);
    });
  });

  describe("Burning", function () {
    it("Should allow token holders to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("1000");
      const initialBalance = await token.balanceOf(owner.address);

      await token.burn(burnAmount);

      expect(await token.balanceOf(owner.address)).to.equal(initialBalance - burnAmount);
    });

    it("Should burn tokens with reason", async function () {
      const burnAmount = ethers.parseEther("1000");
      await expect(token.burnWithReason(burnAmount, "Test burn"))
        .to.emit(token, "TokensBurned")
        .withArgs(owner.address, burnAmount, "Test burn");
    });
  });

  describe("Pausing", function () {
    it("Should allow pauser to pause transfers", async function () {
      await token.pause();

      const transferAmount = ethers.parseEther("100");
      await expect(
        token.transfer(addr1.address, transferAmount)
      ).to.be.reverted;
    });

    it("Should allow pauser to unpause transfers", async function () {
      await token.pause();
      await token.unpause();

      const transferAmount = ethers.parseEther("100");
      await expect(token.transfer(addr1.address, transferAmount)).to.not.be.reverted;
    });

    it("Should not allow non-pauser to pause", async function () {
      await expect(token.connect(addr1).pause()).to.be.reverted;
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("100");
      await token.transfer(addr1.address, transferAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);

      await token.connect(addr1).transfer(addr2.address, transferAmount);
      expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);

      await expect(
        token.connect(addr1).transfer(owner.address, ethers.parseEther("1"))
      ).to.be.reverted;

      expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });
});
