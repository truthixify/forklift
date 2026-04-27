// Copyright 2025 Forklift. Apache-2.0 license.

import { parseEscrowLog, ESCROW_EVENT_NAMES } from './events';
import { BOUNTY_ESCROW_ABI } from './abi';
import { encodeEventTopics, type Log } from 'viem';

describe('ESCROW_EVENT_NAMES', () => {
  it('contains all 11 event names', () => {
    expect(ESCROW_EVENT_NAMES).toHaveLength(11);
    expect(ESCROW_EVENT_NAMES).toContain('BountyCreated');
    expect(ESCROW_EVENT_NAMES).toContain('ClaimSubmitted');
    expect(ESCROW_EVENT_NAMES).toContain('BountyAssigned');
    expect(ESCROW_EVENT_NAMES).toContain('DeliverySubmitted');
    expect(ESCROW_EVENT_NAMES).toContain('BountyPaid');
    expect(ESCROW_EVENT_NAMES).toContain('BountyRefunded');
    expect(ESCROW_EVENT_NAMES).toContain('BountyExpired');
    expect(ESCROW_EVENT_NAMES).toContain('BountyCancelled');
    expect(ESCROW_EVENT_NAMES).toContain('ClaimGhosted');
    expect(ESCROW_EVENT_NAMES).toContain('ClaimWithdrawn');
    expect(ESCROW_EVENT_NAMES).toContain('ReputationUpdated');
  });
});

describe('parseEscrowLog', () => {
  it('returns null for unrecognized log', () => {
    const log: Log = {
      address: '0x0000000000000000000000000000000000000000',
      blockHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      blockNumber: 1n,
      data: '0x',
      logIndex: 0,
      transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
      transactionIndex: 0,
      removed: false,
      topics: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
    };

    expect(parseEscrowLog(log)).toBeNull();
  });

  it('parses a BountyExpired event', () => {
    const abiItem = BOUNTY_ESCROW_ABI.find(
      (item) => item.type === 'event' && 'name' in item && item.name === 'BountyExpired',
    );

    if (!abiItem || abiItem.type !== 'event') {
      throw new Error('BountyExpired event not found in ABI');
    }

    const bountyId = '0x0000000000000000000000000000000000000000000000000000000000000001' as const;
    const topics = encodeEventTopics({
      abi: BOUNTY_ESCROW_ABI,
      eventName: 'BountyExpired',
      args: { bountyId },
    });

    const log = {
      address: '0x0000000000000000000000000000000000000000' as const,
      blockHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as const,
      blockNumber: 100n,
      data: '0x' as const,
      logIndex: 3,
      transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000abc' as const,
      transactionIndex: 0,
      removed: false,
      topics: topics as [`0x${string}`, ...`0x${string}`[]],
    } satisfies Log;

    const parsed = parseEscrowLog(log);
    expect(parsed).not.toBeNull();
    expect(parsed!.eventName).toBe('BountyExpired');
    expect(parsed!.blockNumber).toBe(100n);
    expect(parsed!.logIndex).toBe(3);
  });
});
