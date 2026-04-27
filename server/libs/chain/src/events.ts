// Copyright 2025 Forklift. Apache-2.0 license.

import { type Log, decodeEventLog } from 'viem';

import { BOUNTY_ESCROW_ABI } from './abi';

export const ESCROW_EVENT_NAMES = [
  'BountyCreated',
  'ClaimSubmitted',
  'ClaimWithdrawn',
  'BountyAssigned',
  'DeliverySubmitted',
  'BountyPaid',
  'BountyRefunded',
  'BountyExpired',
  'BountyCancelled',
  'ClaimGhosted',
  'ReputationUpdated',
] as const;

export type EscrowEventName = (typeof ESCROW_EVENT_NAMES)[number];

export interface ParsedEscrowEvent {
  eventName: EscrowEventName;
  args: Record<string, unknown>;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
}

export function parseEscrowLog(log: Log): ParsedEscrowEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: BOUNTY_ESCROW_ABI,
      data: log.data,
      topics: log.topics,
    });

    if (!ESCROW_EVENT_NAMES.includes(decoded.eventName as EscrowEventName)) {
      return null;
    }

    return {
      eventName: decoded.eventName as EscrowEventName,
      args: decoded.args as Record<string, unknown>,
      blockNumber: log.blockNumber ?? 0n,
      transactionHash: log.transactionHash ?? '0x',
      logIndex: log.logIndex ?? 0,
    };
  } catch {
    return null;
  }
}
