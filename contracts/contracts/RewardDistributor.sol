// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RewardDistributor
 * @dev Contract for distributing rewards to users based on their contributions
 * Supports:
 * - Multiple reward pools (J Hub, J Studio, J Academy, J Info, J Alpha)
 * - Secure reward claiming
 * - Admin controls
 * - Emergency pause
 */
contract RewardDistributor is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC20 public rewardToken;

    enum RewardType {
        J_HUB,
        J_STUDIO,
        J_ACADEMY,
        J_INFO,
        J_ALPHA
    }

    struct Reward {
        uint256 amount;
        RewardType rewardType;
        bool claimed;
        uint256 timestamp;
        string reason;
    }

    // user address => reward id => Reward
    mapping(address => mapping(uint256 => Reward)) public rewards;
    // user address => number of rewards
    mapping(address => uint256) public userRewardCount;
    // user address => total claimed amount
    mapping(address => uint256) public totalClaimed;

    event RewardAdded(
        address indexed user,
        uint256 indexed rewardId,
        uint256 amount,
        RewardType rewardType,
        string reason
    );
    event RewardClaimed(address indexed user, uint256 indexed rewardId, uint256 amount);
    event BatchRewardAdded(uint256 totalAmount, uint256 recipientCount);

    constructor(address _rewardToken, address defaultAdmin) {
        require(_rewardToken != address(0), "Invalid token address");
        rewardToken = IERC20(_rewardToken);

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(DISTRIBUTOR_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
    }

    /**
     * @dev Add reward for a user
     * @param user User address
     * @param amount Reward amount
     * @param rewardType Type of reward
     * @param reason Reason for reward
     */
    function addReward(
        address user,
        uint256 amount,
        RewardType rewardType,
        string memory reason
    ) external onlyRole(DISTRIBUTOR_ROLE) whenNotPaused {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");

        uint256 rewardId = userRewardCount[user];

        rewards[user][rewardId] = Reward({
            amount: amount,
            rewardType: rewardType,
            claimed: false,
            timestamp: block.timestamp,
            reason: reason
        });

        userRewardCount[user]++;

        emit RewardAdded(user, rewardId, amount, rewardType, reason);
    }

    /**
     * @dev Add rewards to multiple users in batch
     * @param users Array of user addresses
     * @param amounts Array of reward amounts
     * @param rewardTypes Array of reward types
     * @param reason Reason for rewards
     */
    function batchAddRewards(
        address[] memory users,
        uint256[] memory amounts,
        RewardType[] memory rewardTypes,
        string memory reason
    ) external onlyRole(DISTRIBUTOR_ROLE) whenNotPaused {
        require(
            users.length == amounts.length && users.length == rewardTypes.length,
            "Arrays length mismatch"
        );

        uint256 totalAmount = 0;

        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "Invalid user address");
            require(amounts[i] > 0, "Amount must be greater than 0");

            uint256 rewardId = userRewardCount[users[i]];

            rewards[users[i]][rewardId] = Reward({
                amount: amounts[i],
                rewardType: rewardTypes[i],
                claimed: false,
                timestamp: block.timestamp,
                reason: reason
            });

            userRewardCount[users[i]]++;
            totalAmount += amounts[i];

            emit RewardAdded(users[i], rewardId, amounts[i], rewardTypes[i], reason);
        }

        emit BatchRewardAdded(totalAmount, users.length);
    }

    /**
     * @dev Claim a specific reward
     * @param rewardId Reward ID to claim
     */
    function claimReward(uint256 rewardId) external nonReentrant whenNotPaused {
        require(rewardId < userRewardCount[msg.sender], "Invalid reward ID");

        Reward storage reward = rewards[msg.sender][rewardId];
        require(!reward.claimed, "Reward already claimed");
        require(reward.amount > 0, "Invalid reward amount");

        reward.claimed = true;
        totalClaimed[msg.sender] += reward.amount;

        rewardToken.safeTransfer(msg.sender, reward.amount);

        emit RewardClaimed(msg.sender, rewardId, reward.amount);
    }

    /**
     * @dev Claim multiple rewards at once
     * @param rewardIds Array of reward IDs to claim
     */
    function claimMultipleRewards(uint256[] memory rewardIds)
        external
        nonReentrant
        whenNotPaused
    {
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < rewardIds.length; i++) {
            uint256 rewardId = rewardIds[i];
            require(rewardId < userRewardCount[msg.sender], "Invalid reward ID");

            Reward storage reward = rewards[msg.sender][rewardId];
            require(!reward.claimed, "Reward already claimed");
            require(reward.amount > 0, "Invalid reward amount");

            reward.claimed = true;
            totalAmount += reward.amount;

            emit RewardClaimed(msg.sender, rewardId, reward.amount);
        }

        totalClaimed[msg.sender] += totalAmount;
        rewardToken.safeTransfer(msg.sender, totalAmount);
    }

    /**
     * @dev Get unclaimed rewards for a user
     * @param user User address
     * @return Array of unclaimed reward IDs
     */
    function getUnclaimedRewards(address user) external view returns (uint256[] memory) {
        uint256 count = userRewardCount[user];
        uint256 unclaimedCount = 0;

        // First, count unclaimed rewards
        for (uint256 i = 0; i < count; i++) {
            if (!rewards[user][i].claimed) {
                unclaimedCount++;
            }
        }

        // Create array of unclaimed reward IDs
        uint256[] memory unclaimedRewards = new uint256[](unclaimedCount);
        uint256 index = 0;

        for (uint256 i = 0; i < count; i++) {
            if (!rewards[user][i].claimed) {
                unclaimedRewards[index] = i;
                index++;
            }
        }

        return unclaimedRewards;
    }

    /**
     * @dev Get total unclaimed amount for a user
     * @param user User address
     * @return Total unclaimed amount
     */
    function getUnclaimedAmount(address user) external view returns (uint256) {
        uint256 count = userRewardCount[user];
        uint256 totalUnclaimed = 0;

        for (uint256 i = 0; i < count; i++) {
            if (!rewards[user][i].claimed) {
                totalUnclaimed += rewards[user][i].amount;
            }
        }

        return totalUnclaimed;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Withdraw tokens from contract (emergency only)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address to, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(to != address(0), "Invalid address");
        rewardToken.safeTransfer(to, amount);
    }
}
