// Copyright 2025 Forklift. Apache-2.0 license.

export interface BountyCreatedEvent {
  bountyId: `0x${string}`;
  poster: `0x${string}`;
  amountUSDT: bigint;
  feeUSDT: bigint;
  deliverableSchemaHash: `0x${string}`;
  verifierConfigHash: `0x${string}`;
  deliveryDeadline: bigint;
}

export interface ClaimSubmittedEvent {
  bountyId: `0x${string}`;
  agent: `0x${string}`;
  proposalHash: `0x${string}`;
  assertedDimensions: number[];
}

export interface ClaimWithdrawnEvent {
  bountyId: `0x${string}`;
  agent: `0x${string}`;
  reason: number;
}

export interface BountyAssignedEvent {
  bountyId: `0x${string}`;
  assignedAgent: `0x${string}`;
  waitlist: `0x${string}`[];
  scoringHash: `0x${string}`;
  deliveryDeadline: bigint;
}

export interface DeliverySubmittedEvent {
  bountyId: `0x${string}`;
  agent: `0x${string}`;
  deliveryHash: `0x${string}`;
}

export interface BountyPaidEvent {
  bountyId: `0x${string}`;
  agent: `0x${string}`;
  grossUSDT: bigint;
  feeUSDT: bigint;
  netUSDT: bigint;
}

export interface BountyRefundedEvent {
  bountyId: `0x${string}`;
  poster: `0x${string}`;
  amountUSDT: bigint;
  reason: number;
}

export interface BountyExpiredEvent {
  bountyId: `0x${string}`;
}

export interface BountyCancelledEvent {
  bountyId: `0x${string}`;
}

export interface ClaimGhostedEvent {
  bountyId: `0x${string}`;
  agent: `0x${string}`;
}

export interface ReputationUpdatedEvent {
  party: `0x${string}`;
  sourceBountyId: `0x${string}`;
  side: number;
  recordHash: `0x${string}`;
}

export type EscrowEvent =
  | { name: 'BountyCreated'; args: BountyCreatedEvent }
  | { name: 'ClaimSubmitted'; args: ClaimSubmittedEvent }
  | { name: 'ClaimWithdrawn'; args: ClaimWithdrawnEvent }
  | { name: 'BountyAssigned'; args: BountyAssignedEvent }
  | { name: 'DeliverySubmitted'; args: DeliverySubmittedEvent }
  | { name: 'BountyPaid'; args: BountyPaidEvent }
  | { name: 'BountyRefunded'; args: BountyRefundedEvent }
  | { name: 'BountyExpired'; args: BountyExpiredEvent }
  | { name: 'BountyCancelled'; args: BountyCancelledEvent }
  | { name: 'ClaimGhosted'; args: ClaimGhostedEvent }
  | { name: 'ReputationUpdated'; args: ReputationUpdatedEvent };
