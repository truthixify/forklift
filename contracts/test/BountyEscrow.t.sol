// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BountyEscrow} from "../src/BountyEscrow.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract BountyEscrowTest is Test {
    BountyEscrow public escrow;
    MockERC20 public usdt;

    address public owner = address(this);
    uint256 public brokerPk = 0xB01;
    address public broker = vm.addr(brokerPk);
    address public treasury = makeAddr("treasury");
    address public poster = makeAddr("poster");
    address public agent1 = makeAddr("agent1");
    address public agent2 = makeAddr("agent2");
    address public agent3 = makeAddr("agent3");

    bytes32 public constant BOUNTY_ID = keccak256("bounty-1");
    bytes32 public constant SCHEMA_HASH = keccak256("schema");
    bytes32 public constant VERIFIER_HASH = keccak256("verifier");
    bytes32 public constant PROPOSAL_HASH = keccak256("proposal");
    bytes32 public constant DELIVERY_HASH = keccak256("delivery");
    bytes32 public constant SCORING_HASH = keccak256("scoring");
    bytes32 public constant SETTLEMENT_HASH = keccak256("settlement");

    uint256 public constant AMOUNT = 100 ether;
    uint256 public constant FEE = 5 ether; // 5% of 100
    uint64 public deadline;

    // EIP-712 type hashes (must match contract)
    bytes32 public constant ASSIGN_TYPEHASH =
        keccak256("Assign(bytes32 bountyId,address agent,bytes32 scoringHash)");
    bytes32 public constant RELEASE_TYPEHASH =
        keccak256("Release(bytes32 bountyId,address agent,bytes32 settlementHash)");
    bytes32 public constant REFUND_TYPEHASH =
        keccak256("Refund(bytes32 bountyId,bytes32 settlementHash,uint8 reason)");

    function setUp() public {
        usdt = new MockERC20("USDT", "USDT", 18);
        escrow = new BountyEscrow(usdt, broker, treasury);
        deadline = uint64(block.timestamp + 1 days);

        // Fund poster
        usdt.mint(poster, 1000 ether);
        vm.prank(poster);
        usdt.approve(address(escrow), type(uint256).max);
    }

    // ──────────────────────────────────────────────
    //  Helpers
    // ──────────────────────────────────────────────

    function _createBounty() internal returns (bytes32) {
        vm.prank(poster);
        escrow.createBounty(BOUNTY_ID, AMOUNT, deadline, SCHEMA_HASH, VERIFIER_HASH);
        return BOUNTY_ID;
    }

    function _signAssign(bytes32 bountyId, address agent, bytes32 scoringHash)
        internal
        view
        returns (bytes memory)
    {
        bytes32 structHash = keccak256(abi.encode(ASSIGN_TYPEHASH, bountyId, agent, scoringHash));
        bytes32 digest = _hashTypedData(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(brokerPk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signRelease(bytes32 bountyId, address agent, bytes32 settlementHash)
        internal
        view
        returns (bytes memory)
    {
        bytes32 structHash = keccak256(abi.encode(RELEASE_TYPEHASH, bountyId, agent, settlementHash));
        bytes32 digest = _hashTypedData(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(brokerPk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signRefund(bytes32 bountyId, bytes32 settlementHash, uint8 reason)
        internal
        view
        returns (bytes memory)
    {
        bytes32 structHash = keccak256(abi.encode(REFUND_TYPEHASH, bountyId, settlementHash, reason));
        bytes32 digest = _hashTypedData(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(brokerPk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _hashTypedData(bytes32 structHash) internal view returns (bytes32) {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("BountyEscrow")),
                keccak256(bytes("1")),
                block.chainid,
                address(escrow)
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    function _assignBounty(bytes32 bountyId) internal {
        address[] memory waitlist = new address[](1);
        waitlist[0] = agent2;
        bytes memory sig = _signAssign(bountyId, agent1, SCORING_HASH);
        escrow.assign(bountyId, agent1, waitlist, SCORING_HASH, sig);
    }

    function _deliverBounty(bytes32 bountyId) internal {
        vm.prank(agent1);
        escrow.submitDelivery(bountyId, DELIVERY_HASH);
    }

    // ──────────────────────────────────────────────
    //  createBounty
    // ──────────────────────────────────────────────

    function test_createBounty_success() public {
        uint256 posterBefore = usdt.balanceOf(poster);
        uint256 treasuryBefore = usdt.balanceOf(treasury);

        _createBounty();

        // Poster paid amount + fee
        assertEq(usdt.balanceOf(poster), posterBefore - AMOUNT - FEE);
        // Escrow holds the amount
        assertEq(usdt.balanceOf(address(escrow)), AMOUNT);
        // Treasury got the fee
        assertEq(usdt.balanceOf(treasury), treasuryBefore + FEE);

        // Bounty state
        (address p, uint256 amt, uint256 fee, , , , uint8 status) = escrow.bounties(BOUNTY_ID);
        assertEq(p, poster);
        assertEq(amt, AMOUNT);
        assertEq(fee, FEE);
        assertEq(status, escrow.STATUS_OPEN());
    }

    function test_createBounty_emitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit BountyEscrow.BountyCreated(BOUNTY_ID, poster, AMOUNT, FEE, SCHEMA_HASH, VERIFIER_HASH, deadline);
        _createBounty();
    }

    function test_createBounty_revertsZeroAmount() public {
        vm.prank(poster);
        vm.expectRevert(BountyEscrow.ZeroAmount.selector);
        escrow.createBounty(BOUNTY_ID, 0, deadline, SCHEMA_HASH, VERIFIER_HASH);
    }

    function test_createBounty_revertsDeadlineInPast() public {
        vm.prank(poster);
        vm.expectRevert(BountyEscrow.DeadlineInPast.selector);
        escrow.createBounty(BOUNTY_ID, AMOUNT, uint64(block.timestamp - 1), SCHEMA_HASH, VERIFIER_HASH);
    }

    function test_createBounty_revertsDuplicateId() public {
        _createBounty();
        vm.prank(poster);
        vm.expectRevert();
        escrow.createBounty(BOUNTY_ID, AMOUNT, deadline, SCHEMA_HASH, VERIFIER_HASH);
    }

    function testFuzz_createBounty_feeCalculation(uint256 amount) public {
        amount = bound(amount, 1, 1e30);
        bytes32 id = keccak256(abi.encode("fuzz", amount));

        usdt.mint(poster, amount * 2);
        vm.prank(poster);
        usdt.approve(address(escrow), type(uint256).max);

        vm.prank(poster);
        escrow.createBounty(id, amount, deadline, SCHEMA_HASH, VERIFIER_HASH);

        (, , uint256 fee, , , , ) = escrow.bounties(id);
        assertEq(fee, (amount * 500) / 10000);
    }

    // ──────────────────────────────────────────────
    //  submitClaim
    // ──────────────────────────────────────────────

    function test_submitClaim_success() public {
        _createBounty();
        uint8[] memory dims = new uint8[](2);
        dims[0] = 1;
        dims[1] = 2;

        vm.prank(agent1);
        escrow.submitClaim(BOUNTY_ID, PROPOSAL_HASH, dims);

        assertTrue(escrow.hasClaimed(BOUNTY_ID, agent1));
        assertEq(escrow.claimCount(BOUNTY_ID), 1);
    }

    function test_submitClaim_emitsEvent() public {
        _createBounty();
        uint8[] memory dims = new uint8[](1);
        dims[0] = 3;

        vm.expectEmit(true, true, false, true);
        emit BountyEscrow.ClaimSubmitted(BOUNTY_ID, agent1, PROPOSAL_HASH, dims);

        vm.prank(agent1);
        escrow.submitClaim(BOUNTY_ID, PROPOSAL_HASH, dims);
    }

    function test_submitClaim_revertsBountyNotFound() public {
        uint8[] memory dims = new uint8[](0);
        vm.prank(agent1);
        vm.expectRevert(BountyEscrow.BountyNotFound.selector);
        escrow.submitClaim(bytes32(0), PROPOSAL_HASH, dims);
    }

    function test_submitClaim_revertsDoubleClaim() public {
        _createBounty();
        uint8[] memory dims = new uint8[](0);

        vm.prank(agent1);
        escrow.submitClaim(BOUNTY_ID, PROPOSAL_HASH, dims);

        vm.prank(agent1);
        vm.expectRevert(BountyEscrow.AlreadyClaimed.selector);
        escrow.submitClaim(BOUNTY_ID, PROPOSAL_HASH, dims);
    }

    function test_submitClaim_multipleAgents() public {
        _createBounty();
        uint8[] memory dims = new uint8[](0);

        vm.prank(agent1);
        escrow.submitClaim(BOUNTY_ID, PROPOSAL_HASH, dims);
        vm.prank(agent2);
        escrow.submitClaim(BOUNTY_ID, PROPOSAL_HASH, dims);
        vm.prank(agent3);
        escrow.submitClaim(BOUNTY_ID, PROPOSAL_HASH, dims);

        assertEq(escrow.claimCount(BOUNTY_ID), 3);
    }

    // ──────────────────────────────────────────────
    //  withdrawClaim
    // ──────────────────────────────────────────────

    function test_withdrawClaim_emitsEvent() public {
        _createBounty();
        uint8[] memory dims = new uint8[](0);
        vm.prank(agent1);
        escrow.submitClaim(BOUNTY_ID, PROPOSAL_HASH, dims);

        vm.expectEmit(true, true, false, true);
        emit BountyEscrow.ClaimWithdrawn(BOUNTY_ID, agent1, 1);

        vm.prank(agent1);
        escrow.withdrawClaim(BOUNTY_ID, 1);
    }

    function test_withdrawClaim_revertsIfNotClaimed() public {
        _createBounty();
        vm.prank(agent1);
        vm.expectRevert(BountyEscrow.AlreadyClaimed.selector);
        escrow.withdrawClaim(BOUNTY_ID, 0);
    }

    // ──────────────────────────────────────────────
    //  assign
    // ──────────────────────────────────────────────

    function test_assign_success() public {
        _createBounty();

        uint8[] memory dims = new uint8[](0);
        vm.prank(agent1);
        escrow.submitClaim(BOUNTY_ID, PROPOSAL_HASH, dims);

        address[] memory waitlist = new address[](1);
        waitlist[0] = agent2;
        bytes memory sig = _signAssign(BOUNTY_ID, agent1, SCORING_HASH);

        escrow.assign(BOUNTY_ID, agent1, waitlist, SCORING_HASH, sig);

        (, , , , , address assigned, uint8 status) = escrow.bounties(BOUNTY_ID);
        assertEq(assigned, agent1);
        assertEq(status, escrow.STATUS_ASSIGNED());

        address[] memory wl = escrow.getWaitlist(BOUNTY_ID);
        assertEq(wl.length, 1);
        assertEq(wl[0], agent2);
    }

    function test_assign_emitsEvent() public {
        _createBounty();

        address[] memory waitlist = new address[](0);
        bytes memory sig = _signAssign(BOUNTY_ID, agent1, SCORING_HASH);

        vm.expectEmit(true, true, false, true);
        emit BountyEscrow.BountyAssigned(BOUNTY_ID, agent1, waitlist, SCORING_HASH, deadline);

        escrow.assign(BOUNTY_ID, agent1, waitlist, SCORING_HASH, sig);
    }

    function test_assign_revertsInvalidSignature() public {
        _createBounty();
        address[] memory waitlist = new address[](0);

        // Sign with wrong key
        uint256 fakePk = 0xDEAD;
        bytes32 structHash = keccak256(abi.encode(ASSIGN_TYPEHASH, BOUNTY_ID, agent1, SCORING_HASH));
        bytes32 digest = _hashTypedData(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(fakePk, digest);
        bytes memory fakeSig = abi.encodePacked(r, s, v);

        vm.expectRevert(BountyEscrow.InvalidSignature.selector);
        escrow.assign(BOUNTY_ID, agent1, waitlist, SCORING_HASH, fakeSig);
    }

    function test_assign_revertsBadStatus() public {
        _createBounty();
        address[] memory waitlist = new address[](0);
        bytes memory sig = _signAssign(BOUNTY_ID, agent1, SCORING_HASH);
        escrow.assign(BOUNTY_ID, agent1, waitlist, SCORING_HASH, sig);

        // Try to assign again when already assigned
        bytes memory sig2 = _signAssign(BOUNTY_ID, agent2, SCORING_HASH);
        vm.expectRevert(abi.encodeWithSelector(BountyEscrow.BadStatus.selector, 1, 0));
        escrow.assign(BOUNTY_ID, agent2, waitlist, SCORING_HASH, sig2);
    }

    function test_assign_anyoneCanRelay() public {
        _createBounty();
        address[] memory waitlist = new address[](0);
        bytes memory sig = _signAssign(BOUNTY_ID, agent1, SCORING_HASH);

        // Random address relays the signed assignment
        address relayer = makeAddr("relayer");
        vm.prank(relayer);
        escrow.assign(BOUNTY_ID, agent1, waitlist, SCORING_HASH, sig);

        (, , , , , address assigned, ) = escrow.bounties(BOUNTY_ID);
        assertEq(assigned, agent1);
    }

    // ──────────────────────────────────────────────
    //  submitDelivery
    // ──────────────────────────────────────────────

    function test_submitDelivery_success() public {
        _createBounty();
        _assignBounty(BOUNTY_ID);

        vm.prank(agent1);
        escrow.submitDelivery(BOUNTY_ID, DELIVERY_HASH);

        (, , , , , , uint8 status) = escrow.bounties(BOUNTY_ID);
        assertEq(status, escrow.STATUS_DELIVERED());
    }

    function test_submitDelivery_emitsEvent() public {
        _createBounty();
        _assignBounty(BOUNTY_ID);

        vm.expectEmit(true, true, false, true);
        emit BountyEscrow.DeliverySubmitted(BOUNTY_ID, agent1, DELIVERY_HASH);

        vm.prank(agent1);
        escrow.submitDelivery(BOUNTY_ID, DELIVERY_HASH);
    }

    function test_submitDelivery_revertsNotAssignedAgent() public {
        _createBounty();
        _assignBounty(BOUNTY_ID);

        vm.prank(agent2);
        vm.expectRevert(BountyEscrow.NotAssignedAgent.selector);
        escrow.submitDelivery(BOUNTY_ID, DELIVERY_HASH);
    }

    function test_submitDelivery_revertsBadStatus() public {
        _createBounty();

        vm.prank(agent1);
        vm.expectRevert(abi.encodeWithSelector(BountyEscrow.BadStatus.selector, 0, 1));
        escrow.submitDelivery(BOUNTY_ID, DELIVERY_HASH);
    }

    // ──────────────────────────────────────────────
    //  release
    // ──────────────────────────────────────────────

    function test_release_success() public {
        _createBounty();
        _assignBounty(BOUNTY_ID);
        _deliverBounty(BOUNTY_ID);

        uint256 agentBefore = usdt.balanceOf(agent1);
        uint256 treasuryBefore = usdt.balanceOf(treasury);

        bytes memory sig = _signRelease(BOUNTY_ID, agent1, SETTLEMENT_HASH);
        escrow.release(BOUNTY_ID, agent1, SETTLEMENT_HASH, sig);

        uint256 payoutFee = (AMOUNT * 1000) / 10000; // 10%
        uint256 netPayout = AMOUNT - payoutFee;

        assertEq(usdt.balanceOf(agent1), agentBefore + netPayout);
        assertEq(usdt.balanceOf(treasury), treasuryBefore + payoutFee);
        assertEq(usdt.balanceOf(address(escrow)), 0);

        (, , , , , , uint8 status) = escrow.bounties(BOUNTY_ID);
        assertEq(status, escrow.STATUS_PAID());
    }

    function test_release_emitsEvent() public {
        _createBounty();
        _assignBounty(BOUNTY_ID);
        _deliverBounty(BOUNTY_ID);

        uint256 payoutFee = (AMOUNT * 1000) / 10000;
        uint256 netPayout = AMOUNT - payoutFee;

        vm.expectEmit(true, true, false, true);
        emit BountyEscrow.BountyPaid(BOUNTY_ID, agent1, AMOUNT, payoutFee, netPayout);

        bytes memory sig = _signRelease(BOUNTY_ID, agent1, SETTLEMENT_HASH);
        escrow.release(BOUNTY_ID, agent1, SETTLEMENT_HASH, sig);
    }

    function test_release_revertsInvalidSignature() public {
        _createBounty();
        _assignBounty(BOUNTY_ID);
        _deliverBounty(BOUNTY_ID);

        uint256 fakePk = 0xDEAD;
        bytes32 structHash = keccak256(abi.encode(RELEASE_TYPEHASH, BOUNTY_ID, agent1, SETTLEMENT_HASH));
        bytes32 digest = _hashTypedData(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(fakePk, digest);
        bytes memory fakeSig = abi.encodePacked(r, s, v);

        vm.expectRevert(BountyEscrow.InvalidSignature.selector);
        escrow.release(BOUNTY_ID, agent1, SETTLEMENT_HASH, fakeSig);
    }

    function test_release_revertsBadStatus() public {
        _createBounty();

        bytes memory sig = _signRelease(BOUNTY_ID, agent1, SETTLEMENT_HASH);
        vm.expectRevert(abi.encodeWithSelector(BountyEscrow.BadStatus.selector, 0, 2));
        escrow.release(BOUNTY_ID, agent1, SETTLEMENT_HASH, sig);
    }

    function testFuzz_release_feeCalculation(uint256 amount) public {
        amount = bound(amount, 1, 1e30);
        bytes32 id = keccak256(abi.encode("release-fuzz", amount));

        usdt.mint(poster, amount * 2);
        vm.prank(poster);
        usdt.approve(address(escrow), type(uint256).max);

        vm.prank(poster);
        escrow.createBounty(id, amount, deadline, SCHEMA_HASH, VERIFIER_HASH);

        address[] memory waitlist = new address[](0);
        bytes memory assignSig = _signAssign(id, agent1, SCORING_HASH);
        escrow.assign(id, agent1, waitlist, SCORING_HASH, assignSig);

        vm.prank(agent1);
        escrow.submitDelivery(id, DELIVERY_HASH);

        uint256 expectedFee = (amount * 1000) / 10000;
        uint256 expectedNet = amount - expectedFee;

        uint256 agentBefore = usdt.balanceOf(agent1);
        uint256 treasuryBefore = usdt.balanceOf(treasury);

        bytes memory releaseSig = _signRelease(id, agent1, SETTLEMENT_HASH);
        escrow.release(id, agent1, SETTLEMENT_HASH, releaseSig);

        assertEq(usdt.balanceOf(agent1) - agentBefore, expectedNet);
        assertEq(usdt.balanceOf(treasury) - treasuryBefore, expectedFee);
    }

    // ──────────────────────────────────────────────
    //  refund
    // ──────────────────────────────────────────────

    function test_refund_afterDelivery() public {
        _createBounty();
        _assignBounty(BOUNTY_ID);
        _deliverBounty(BOUNTY_ID);

        uint256 posterBefore = usdt.balanceOf(poster);

        bytes memory sig = _signRefund(BOUNTY_ID, SETTLEMENT_HASH, 1);
        escrow.refund(BOUNTY_ID, SETTLEMENT_HASH, 1, sig);

        assertEq(usdt.balanceOf(poster), posterBefore + AMOUNT);
        assertEq(usdt.balanceOf(address(escrow)), 0);

        (, , , , , , uint8 status) = escrow.bounties(BOUNTY_ID);
        assertEq(status, escrow.STATUS_REFUNDED());
    }

    function test_refund_emitsEvent() public {
        _createBounty();
        _assignBounty(BOUNTY_ID);
        _deliverBounty(BOUNTY_ID);

        vm.expectEmit(true, true, false, true);
        emit BountyEscrow.BountyRefunded(BOUNTY_ID, poster, AMOUNT, 1);

        bytes memory sig = _signRefund(BOUNTY_ID, SETTLEMENT_HASH, 1);
        escrow.refund(BOUNTY_ID, SETTLEMENT_HASH, 1, sig);
    }

    function test_refund_revertsInvalidSignature() public {
        _createBounty();
        _assignBounty(BOUNTY_ID);
        _deliverBounty(BOUNTY_ID);

        uint256 fakePk = 0xDEAD;
        bytes32 structHash = keccak256(abi.encode(REFUND_TYPEHASH, BOUNTY_ID, SETTLEMENT_HASH, uint8(1)));
        bytes32 digest = _hashTypedData(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(fakePk, digest);
        bytes memory fakeSig = abi.encodePacked(r, s, v);

        vm.expectRevert(BountyEscrow.InvalidSignature.selector);
        escrow.refund(BOUNTY_ID, SETTLEMENT_HASH, 1, fakeSig);
    }

    // ──────────────────────────────────────────────
    //  cancel
    // ──────────────────────────────────────────────

    function test_cancel_success() public {
        _createBounty();

        uint256 posterBefore = usdt.balanceOf(poster);

        vm.prank(poster);
        escrow.cancel(BOUNTY_ID);

        // Poster gets back the locked amount, NOT the fee
        assertEq(usdt.balanceOf(poster), posterBefore + AMOUNT);
        assertEq(usdt.balanceOf(address(escrow)), 0);

        (, , , , , , uint8 status) = escrow.bounties(BOUNTY_ID);
        assertEq(status, escrow.STATUS_CANCELLED());
    }

    function test_cancel_emitsEvent() public {
        _createBounty();

        vm.expectEmit(true, false, false, false);
        emit BountyEscrow.BountyCancelled(BOUNTY_ID);

        vm.prank(poster);
        escrow.cancel(BOUNTY_ID);
    }

    function test_cancel_revertsNotPoster() public {
        _createBounty();
        vm.prank(agent1);
        vm.expectRevert(BountyEscrow.NotPoster.selector);
        escrow.cancel(BOUNTY_ID);
    }

    function test_cancel_revertsIfHasClaims() public {
        _createBounty();
        uint8[] memory dims = new uint8[](0);
        vm.prank(agent1);
        escrow.submitClaim(BOUNTY_ID, PROPOSAL_HASH, dims);

        vm.prank(poster);
        vm.expectRevert(BountyEscrow.HasClaims.selector);
        escrow.cancel(BOUNTY_ID);
    }

    function test_cancel_revertsBadStatus() public {
        _createBounty();
        _assignBounty(BOUNTY_ID);

        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(BountyEscrow.BadStatus.selector, 1, 0));
        escrow.cancel(BOUNTY_ID);
    }

    // ──────────────────────────────────────────────
    //  expire
    // ──────────────────────────────────────────────

    function test_expire_success() public {
        _createBounty();

        uint256 posterBefore = usdt.balanceOf(poster);

        vm.warp(deadline + 1);
        escrow.expire(BOUNTY_ID);

        assertEq(usdt.balanceOf(poster), posterBefore + AMOUNT);
        assertEq(usdt.balanceOf(address(escrow)), 0);

        (, , , , , , uint8 status) = escrow.bounties(BOUNTY_ID);
        assertEq(status, escrow.STATUS_REFUNDED());
    }

    function test_expire_emitsEvent() public {
        _createBounty();
        vm.warp(deadline + 1);

        vm.expectEmit(true, false, false, false);
        emit BountyEscrow.BountyExpired(BOUNTY_ID);

        escrow.expire(BOUNTY_ID);
    }

    function test_expire_revertsBeforeDeadline() public {
        _createBounty();
        vm.expectRevert(BountyEscrow.DeadlineNotPassed.selector);
        escrow.expire(BOUNTY_ID);
    }

    function test_expire_revertsBadStatus() public {
        _createBounty();
        _assignBounty(BOUNTY_ID);

        vm.warp(deadline + 1);
        vm.expectRevert(abi.encodeWithSelector(BountyEscrow.BadStatus.selector, 1, 0));
        escrow.expire(BOUNTY_ID);
    }

    function test_expire_anyoneCanCall() public {
        _createBounty();
        vm.warp(deadline + 1);

        address rando = makeAddr("rando");
        vm.prank(rando);
        escrow.expire(BOUNTY_ID);

        (, , , , , , uint8 status) = escrow.bounties(BOUNTY_ID);
        assertEq(status, escrow.STATUS_REFUNDED());
    }

    // ──────────────────────────────────────────────
    //  Owner admin
    // ──────────────────────────────────────────────

    function test_setBroker() public {
        address newBroker = makeAddr("newBroker");
        escrow.setBroker(newBroker);
        assertEq(escrow.broker(), newBroker);
    }

    function test_setBroker_revertsNonOwner() public {
        vm.prank(agent1);
        vm.expectRevert();
        escrow.setBroker(agent1);
    }

    function test_setPlatformTreasury() public {
        address newTreasury = makeAddr("newTreasury");
        escrow.setPlatformTreasury(newTreasury);
        assertEq(escrow.platformTreasury(), newTreasury);
    }

    // ──────────────────────────────────────────────
    //  Full lifecycle
    // ──────────────────────────────────────────────

    function test_fullLifecycle_createToPayment() public {
        // 1. Create
        _createBounty();

        // 2. Claims
        uint8[] memory dims = new uint8[](0);
        vm.prank(agent1);
        escrow.submitClaim(BOUNTY_ID, PROPOSAL_HASH, dims);
        vm.prank(agent2);
        escrow.submitClaim(BOUNTY_ID, keccak256("proposal2"), dims);

        // 3. Assign
        _assignBounty(BOUNTY_ID);

        // 4. Deliver
        _deliverBounty(BOUNTY_ID);

        // 5. Release
        bytes memory releaseSig = _signRelease(BOUNTY_ID, agent1, SETTLEMENT_HASH);
        escrow.release(BOUNTY_ID, agent1, SETTLEMENT_HASH, releaseSig);

        // Verify final state
        (, , , , , , uint8 status) = escrow.bounties(BOUNTY_ID);
        assertEq(status, escrow.STATUS_PAID());
        assertEq(usdt.balanceOf(address(escrow)), 0);
    }

    function test_fullLifecycle_createToRefund() public {
        _createBounty();

        _assignBounty(BOUNTY_ID);
        _deliverBounty(BOUNTY_ID);

        bytes memory refundSig = _signRefund(BOUNTY_ID, SETTLEMENT_HASH, 1);
        escrow.refund(BOUNTY_ID, SETTLEMENT_HASH, 1, refundSig);

        (, , , , , , uint8 status) = escrow.bounties(BOUNTY_ID);
        assertEq(status, escrow.STATUS_REFUNDED());
        assertEq(usdt.balanceOf(address(escrow)), 0);
    }

    function test_fullLifecycle_createToExpiry() public {
        _createBounty();
        vm.warp(deadline + 1);
        escrow.expire(BOUNTY_ID);

        (, , , , , , uint8 status) = escrow.bounties(BOUNTY_ID);
        assertEq(status, escrow.STATUS_REFUNDED());
        assertEq(usdt.balanceOf(address(escrow)), 0);
    }

    function test_fullLifecycle_createToCancel() public {
        _createBounty();

        vm.prank(poster);
        escrow.cancel(BOUNTY_ID);

        (, , , , , , uint8 status) = escrow.bounties(BOUNTY_ID);
        assertEq(status, escrow.STATUS_CANCELLED());
        assertEq(usdt.balanceOf(address(escrow)), 0);
    }
}
