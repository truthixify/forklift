// Copyright 2025 Forklift. Apache-2.0 license.
// AssemblyScript event handlers for Goldsky subgraph.

import { Bytes, BigInt } from "@graphprotocol/graph-ts";
import {
  BountyCreated,
  ClaimSubmitted,
  ClaimWithdrawn,
  BountyAssigned,
  DeliverySubmitted,
  BountyPaid,
  BountyRefunded,
  BountyExpired,
  BountyCancelled,
  ClaimGhosted,
  ReputationUpdated,
} from "../../contracts/out/BountyEscrow.sol/BountyEscrow";
import {
  Bounty,
  Claim,
  Delivery,
  Payment,
  Refund,
  ReputationUpdate,
} from "../generated/schema";

export function handleBountyCreated(event: BountyCreated): void {
  let bounty = new Bounty(event.params.bountyId);
  bounty.poster = event.params.poster;
  bounty.amount = event.params.amountUSDT;
  bounty.fee = event.params.feeUSDT;
  bounty.createdAt = BigInt.fromI64(event.block.timestamp.toI64());
  bounty.deliveryDeadline = BigInt.fromI64(event.params.deliveryDeadline.toI64());
  bounty.status = 0; // OPEN
  bounty.deliverableSchemaHash = event.params.deliverableSchemaHash;
  bounty.verifierConfigHash = event.params.verifierConfigHash;
  bounty.waitlist = [];
  bounty.save();
}

export function handleClaimSubmitted(event: ClaimSubmitted): void {
  let id =
    event.params.bountyId.toHexString() +
    "-" +
    event.params.agent.toHexString();
  let claim = new Claim(id);
  claim.bounty = event.params.bountyId;
  claim.agent = event.params.agent;
  claim.proposalHash = event.params.proposalHash;

  let dims: i32[] = [];
  for (let i = 0; i < event.params.assertedDimensions.length; i++) {
    dims.push(event.params.assertedDimensions[i] as i32);
  }
  claim.assertedDimensions = dims;

  claim.withdrawn = false;
  claim.timestamp = event.block.timestamp;
  claim.save();
}

export function handleClaimWithdrawn(event: ClaimWithdrawn): void {
  let id =
    event.params.bountyId.toHexString() +
    "-" +
    event.params.agent.toHexString();
  let claim = Claim.load(id);
  if (claim) {
    claim.withdrawn = true;
    claim.withdrawReason = event.params.reason as i32;
    claim.save();
  }
}

export function handleBountyAssigned(event: BountyAssigned): void {
  let bounty = Bounty.load(event.params.bountyId);
  if (bounty) {
    bounty.assignedAgent = event.params.assignedAgent;
    bounty.status = 1; // ASSIGNED
    bounty.deliveryDeadline = BigInt.fromI64(
      event.params.deliveryDeadline.toI64()
    );

    let waitlistBytes: Bytes[] = [];
    for (let i = 0; i < event.params.waitlist.length; i++) {
      waitlistBytes.push(event.params.waitlist[i]);
    }
    bounty.waitlist = waitlistBytes;

    bounty.save();
  }
}

export function handleDeliverySubmitted(event: DeliverySubmitted): void {
  let bounty = Bounty.load(event.params.bountyId);
  if (bounty) {
    bounty.status = 2; // DELIVERED
    bounty.save();
  }

  let id =
    event.params.bountyId.toHexString() +
    "-" +
    event.transaction.hash.toHexString();
  let delivery = new Delivery(id);
  delivery.bounty = event.params.bountyId;
  delivery.agent = event.params.agent;
  delivery.deliveryHash = event.params.deliveryHash;
  delivery.timestamp = event.block.timestamp;
  delivery.save();
}

export function handleBountyPaid(event: BountyPaid): void {
  let bounty = Bounty.load(event.params.bountyId);
  if (bounty) {
    bounty.status = 3; // PAID
    bounty.save();
  }

  let id = event.transaction.hash.toHexString();
  let payment = new Payment(id);
  payment.bounty = event.params.bountyId;
  payment.agent = event.params.agent;
  payment.grossUSDT = event.params.grossUSDT;
  payment.feeUSDT = event.params.feeUSDT;
  payment.netUSDT = event.params.netUSDT;
  payment.timestamp = event.block.timestamp;
  payment.save();
}

export function handleBountyRefunded(event: BountyRefunded): void {
  let bounty = Bounty.load(event.params.bountyId);
  if (bounty) {
    bounty.status = 4; // REFUNDED
    bounty.save();
  }

  let id = event.transaction.hash.toHexString();
  let refund = new Refund(id);
  refund.bounty = event.params.bountyId;
  refund.poster = event.params.poster;
  refund.amountUSDT = event.params.amountUSDT;
  refund.reason = event.params.reason as i32;
  refund.timestamp = event.block.timestamp;
  refund.save();
}

export function handleBountyExpired(event: BountyExpired): void {
  let bounty = Bounty.load(event.params.bountyId);
  if (bounty) {
    bounty.status = 4; // REFUNDED (expired = refunded per spec)
    bounty.save();
  }
}

export function handleBountyCancelled(event: BountyCancelled): void {
  let bounty = Bounty.load(event.params.bountyId);
  if (bounty) {
    bounty.status = 6; // CANCELLED
    bounty.save();
  }
}

export function handleClaimGhosted(event: ClaimGhosted): void {
  let id =
    event.params.bountyId.toHexString() +
    "-" +
    event.params.agent.toHexString();
  let claim = Claim.load(id);
  if (claim) {
    claim.withdrawn = true;
    claim.save();
  }
}

export function handleReputationUpdated(event: ReputationUpdated): void {
  let id = event.transaction.hash.toHexString();
  let update = new ReputationUpdate(id);
  update.party = event.params.party;
  update.sourceBountyId = event.params.sourceBountyId;
  update.side = event.params.side as i32;
  update.recordHash = event.params.recordHash;
  update.timestamp = event.block.timestamp;
  update.save();
}
