// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title BountyEscrow
/// @notice Holds bounty funds, releases on broker-signed instructions, emits lifecycle events.
contract BountyEscrow is Ownable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    // ──────────────────────────────────────────────
    //  Types
    // ──────────────────────────────────────────────

    struct Bounty {
        address poster;
        uint256 amount;
        uint256 fee;
        uint64 createdAt;
        uint64 deliveryDeadline;
        address assignedAgent;
        address[] waitlist;
        uint8 status;
    }

    // Status enum as uint8 constants
    uint8 public constant STATUS_OPEN = 0;
    uint8 public constant STATUS_ASSIGNED = 1;
    uint8 public constant STATUS_DELIVERED = 2;
    uint8 public constant STATUS_PAID = 3;
    uint8 public constant STATUS_REFUNDED = 4;
    uint8 public constant STATUS_DISPUTED = 5;
    uint8 public constant STATUS_CANCELLED = 6;

    // Fee constants
    uint16 public constant CREATION_FEE_BPS = 500;
    uint16 public constant PAYOUT_FEE_BPS = 1000;
    uint16 public constant BPS_DENOMINATOR = 10000;

    // ──────────────────────────────────────────────
    //  Storage
    // ──────────────────────────────────────────────

    mapping(bytes32 => Bounty) public bounties;
    mapping(bytes32 => mapping(address => bool)) public hasClaimed;
    mapping(bytes32 => uint256) public claimCount;

    address public broker;
    address public platformTreasury;
    IERC20 public immutable usdt;

    // ──────────────────────────────────────────────
    //  EIP-712 type hashes
    // ──────────────────────────────────────────────

    bytes32 public constant ASSIGN_TYPEHASH =
        keccak256("Assign(bytes32 bountyId,address agent,bytes32 scoringHash)");

    bytes32 public constant RELEASE_TYPEHASH =
        keccak256("Release(bytes32 bountyId,address agent,bytes32 settlementHash)");

    bytes32 public constant REFUND_TYPEHASH =
        keccak256("Refund(bytes32 bountyId,bytes32 settlementHash,uint8 reason)");

    // ──────────────────────────────────────────────
    //  Errors
    // ──────────────────────────────────────────────

    error NotBroker();
    error BountyNotFound();
    error BadStatus(uint8 current, uint8 expected);
    error InvalidSignature();
    error ZeroAmount();
    error DeadlineInPast();
    error AlreadyClaimed();
    error NotAssignedAgent();
    error NotPoster();
    error HasClaims();
    error DeadlineNotPassed();

    // ──────────────────────────────────────────────
    //  Events (spec §17)
    // ──────────────────────────────────────────────

    event BountyCreated(
        bytes32 indexed bountyId,
        address indexed poster,
        uint256 amountUSDT,
        uint256 feeUSDT,
        bytes32 deliverableSchemaHash,
        bytes32 verifierConfigHash,
        uint64 deliveryDeadline
    );

    event ClaimSubmitted(
        bytes32 indexed bountyId,
        address indexed agent,
        bytes32 proposalHash,
        uint8[] assertedDimensions
    );

    event ClaimWithdrawn(
        bytes32 indexed bountyId,
        address indexed agent,
        uint8 reason
    );

    event BountyAssigned(
        bytes32 indexed bountyId,
        address indexed assignedAgent,
        address[] waitlist,
        bytes32 scoringHash,
        uint64 deliveryDeadline
    );

    event DeliverySubmitted(
        bytes32 indexed bountyId,
        address indexed agent,
        bytes32 deliveryHash
    );

    event BountyPaid(
        bytes32 indexed bountyId,
        address indexed agent,
        uint256 grossUSDT,
        uint256 feeUSDT,
        uint256 netUSDT
    );

    event BountyRefunded(
        bytes32 indexed bountyId,
        address indexed poster,
        uint256 amountUSDT,
        uint8 reason
    );

    event BountyExpired(bytes32 indexed bountyId);

    event BountyCancelled(bytes32 indexed bountyId);

    event ClaimGhosted(
        bytes32 indexed bountyId,
        address indexed agent
    );

    event ReputationUpdated(
        address indexed party,
        bytes32 indexed sourceBountyId,
        uint8 side,
        bytes32 recordHash
    );

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor(
        IERC20 _usdt,
        address _broker,
        address _platformTreasury
    ) Ownable(msg.sender) EIP712("BountyEscrow", "1") {
        usdt = _usdt;
        broker = _broker;
        platformTreasury = _platformTreasury;
    }

    // ──────────────────────────────────────────────
    //  Poster actions
    // ──────────────────────────────────────────────

    /// @notice Create a bounty. Pulls amount + 5% fee from poster.
    /// @dev Poster must approve (amount * 10500 / 10000) before calling.
    function createBounty(
        bytes32 bountyId,
        uint256 amount,
        uint64 deliveryDeadline,
        bytes32 deliverableSchemaHash,
        bytes32 verifierConfigHash
    ) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (deliveryDeadline <= block.timestamp) revert DeadlineInPast();
        if (bounties[bountyId].poster != address(0)) revert BadStatus(bounties[bountyId].status, STATUS_OPEN);

        uint256 fee = (amount * CREATION_FEE_BPS) / BPS_DENOMINATOR;

        usdt.safeTransferFrom(msg.sender, address(this), amount);
        usdt.safeTransferFrom(msg.sender, platformTreasury, fee);

        bounties[bountyId] = Bounty({
            poster: msg.sender,
            amount: amount,
            fee: fee,
            createdAt: uint64(block.timestamp),
            deliveryDeadline: deliveryDeadline,
            assignedAgent: address(0),
            waitlist: new address[](0),
            status: STATUS_OPEN
        });

        emit BountyCreated(
            bountyId,
            msg.sender,
            amount,
            fee,
            deliverableSchemaHash,
            verifierConfigHash,
            deliveryDeadline
        );
    }

    /// @notice Poster cancels before any claim arrives.
    function cancel(bytes32 bountyId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyNotFound();
        if (b.poster != msg.sender) revert NotPoster();
        if (b.status != STATUS_OPEN) revert BadStatus(b.status, STATUS_OPEN);
        if (claimCount[bountyId] > 0) revert HasClaims();

        b.status = STATUS_CANCELLED;
        usdt.safeTransfer(b.poster, b.amount);

        emit BountyCancelled(bountyId);
    }

    // ──────────────────────────────────────────────
    //  Worker actions
    // ──────────────────────────────────────────────

    /// @notice Worker agent records its claim.
    function submitClaim(
        bytes32 bountyId,
        bytes32 proposalHash,
        uint8[] calldata dims
    ) external {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyNotFound();
        if (b.status != STATUS_OPEN) revert BadStatus(b.status, STATUS_OPEN);
        if (hasClaimed[bountyId][msg.sender]) revert AlreadyClaimed();

        hasClaimed[bountyId][msg.sender] = true;
        claimCount[bountyId]++;

        emit ClaimSubmitted(bountyId, msg.sender, proposalHash, dims);
    }

    /// @notice Worker withdraws their claim.
    function withdrawClaim(bytes32 bountyId, uint8 reason) external {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyNotFound();
        if (!hasClaimed[bountyId][msg.sender]) revert AlreadyClaimed();

        emit ClaimWithdrawn(bountyId, msg.sender, reason);
    }

    /// @notice Assigned agent submits delivery hash.
    function submitDelivery(bytes32 bountyId, bytes32 deliveryHash) external {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyNotFound();
        if (b.status != STATUS_ASSIGNED) revert BadStatus(b.status, STATUS_ASSIGNED);
        if (b.assignedAgent != msg.sender) revert NotAssignedAgent();

        b.status = STATUS_DELIVERED;

        emit DeliverySubmitted(bountyId, msg.sender, deliveryHash);
    }

    // ──────────────────────────────────────────────
    //  Broker-signed actions
    // ──────────────────────────────────────────────

    /// @notice Assign a bounty. Verified via EIP-712 broker signature.
    function assign(
        bytes32 bountyId,
        address agent,
        address[] calldata waitlist,
        bytes32 scoringHash,
        bytes calldata brokerSig
    ) external {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyNotFound();
        if (b.status != STATUS_OPEN) revert BadStatus(b.status, STATUS_OPEN);

        bytes32 structHash = keccak256(abi.encode(ASSIGN_TYPEHASH, bountyId, agent, scoringHash));
        _verifyBrokerSignature(structHash, brokerSig);

        b.status = STATUS_ASSIGNED;
        b.assignedAgent = agent;
        b.waitlist = waitlist;

        emit BountyAssigned(bountyId, agent, waitlist, scoringHash, b.deliveryDeadline);
    }

    /// @notice Release funds to agent. 10% fee to treasury.
    function release(
        bytes32 bountyId,
        address agent,
        bytes32 settlementHash,
        bytes calldata brokerSig
    ) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyNotFound();
        if (b.status != STATUS_DELIVERED && b.status != STATUS_DISPUTED) {
            revert BadStatus(b.status, STATUS_DELIVERED);
        }

        bytes32 structHash = keccak256(abi.encode(RELEASE_TYPEHASH, bountyId, agent, settlementHash));
        _verifyBrokerSignature(structHash, brokerSig);

        b.status = STATUS_PAID;

        uint256 payoutFee = (b.amount * PAYOUT_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netPayout = b.amount - payoutFee;

        usdt.safeTransfer(platformTreasury, payoutFee);
        usdt.safeTransfer(agent, netPayout);

        emit BountyPaid(bountyId, agent, b.amount, payoutFee, netPayout);
    }

    /// @notice Refund locked amount to poster. 5% creation fee stays.
    function refund(
        bytes32 bountyId,
        bytes32 settlementHash,
        uint8 reason,
        bytes calldata brokerSig
    ) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyNotFound();
        if (b.status != STATUS_DELIVERED && b.status != STATUS_DISPUTED && b.status != STATUS_ASSIGNED) {
            revert BadStatus(b.status, STATUS_DELIVERED);
        }

        bytes32 structHash = keccak256(abi.encode(REFUND_TYPEHASH, bountyId, settlementHash, reason));
        _verifyBrokerSignature(structHash, brokerSig);

        b.status = STATUS_REFUNDED;
        usdt.safeTransfer(b.poster, b.amount);

        emit BountyRefunded(bountyId, b.poster, b.amount, reason);
    }

    /// @notice Anyone can call after deadline if open with no assignment.
    function expire(bytes32 bountyId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyNotFound();
        if (b.status != STATUS_OPEN) revert BadStatus(b.status, STATUS_OPEN);
        if (block.timestamp < b.deliveryDeadline) revert DeadlineNotPassed();

        b.status = STATUS_REFUNDED;
        usdt.safeTransfer(b.poster, b.amount);

        emit BountyExpired(bountyId);
    }

    // ──────────────────────────────────────────────
    //  Owner admin
    // ──────────────────────────────────────────────

    /// @notice Update the broker address.
    function setBroker(address newBroker) external onlyOwner {
        broker = newBroker;
    }

    /// @notice Update the platform treasury address.
    function setPlatformTreasury(address newTreasury) external onlyOwner {
        platformTreasury = newTreasury;
    }

    // ──────────────────────────────────────────────
    //  View helpers
    // ──────────────────────────────────────────────

    /// @notice Get the waitlist for a bounty.
    function getWaitlist(bytes32 bountyId) external view returns (address[] memory) {
        return bounties[bountyId].waitlist;
    }

    // ──────────────────────────────────────────────
    //  Internal
    // ──────────────────────────────────────────────

    function _verifyBrokerSignature(bytes32 structHash, bytes calldata signature) internal view {
        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);
        if (recovered != broker) revert InvalidSignature();
    }
}
