// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title JoblessToken
 * @dev ERC20 Token for the Jobless Ecosystem
 * Features:
 * - Burnable
 * - Pausable (for emergency situations)
 * - Role-based access control
 * - Capped supply
 */
contract JoblessToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens

    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);

    constructor(address defaultAdmin) ERC20("Jobless Token", "JOB") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);

        // Mint initial supply to admin
        _mint(defaultAdmin, 100_000_000 * 10**18); // 100M initial supply
    }

    /**
     * @dev Mint new tokens (only MINTER_ROLE can call)
     * @param to Address to receive tokens
     * @param amount Amount of tokens to mint
     * @param reason Reason for minting (for tracking)
     */
    function mint(address to, uint256 amount, string memory reason) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "JoblessToken: Max supply exceeded");
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }

    /**
     * @dev Batch mint tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint
     */
    function batchMint(address[] memory recipients, uint256[] memory amounts)
        public
        onlyRole(MINTER_ROLE)
    {
        require(recipients.length == amounts.length, "JoblessToken: Arrays length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(totalSupply() + amounts[i] <= MAX_SUPPLY, "JoblessToken: Max supply exceeded");
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i], "Batch mint");
        }
    }

    /**
     * @dev Pause token transfers (only PAUSER_ROLE can call)
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause token transfers (only PAUSER_ROLE can call)
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Burn tokens with reason
     */
    function burnWithReason(uint256 amount, string memory reason) public {
        burn(amount);
        emit TokensBurned(msg.sender, amount, reason);
    }

    // The following functions are overrides required by Solidity
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
