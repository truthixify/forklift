// Copyright 2025 Forklift. Apache-2.0 license.

import {
  BOUNTY_STATUS,
  BOUNTY_STATUS_LABELS,
  CREATION_FEE_BPS,
  PAYOUT_FEE_BPS,
  BPS_DENOMINATOR,
} from './index';

describe('shared-types constants', () => {
  it('has 7 bounty statuses', () => {
    expect(Object.keys(BOUNTY_STATUS)).toHaveLength(7);
  });

  it('maps status values 0-6', () => {
    expect(BOUNTY_STATUS.OPEN).toBe(0);
    expect(BOUNTY_STATUS.ASSIGNED).toBe(1);
    expect(BOUNTY_STATUS.DELIVERED).toBe(2);
    expect(BOUNTY_STATUS.PAID).toBe(3);
    expect(BOUNTY_STATUS.REFUNDED).toBe(4);
    expect(BOUNTY_STATUS.DISPUTED).toBe(5);
    expect(BOUNTY_STATUS.CANCELLED).toBe(6);
  });

  it('has labels for every status', () => {
    for (const value of Object.values(BOUNTY_STATUS)) {
      expect(BOUNTY_STATUS_LABELS[value]).toBeDefined();
    }
  });

  it('has correct fee constants', () => {
    expect(CREATION_FEE_BPS).toBe(500n);
    expect(PAYOUT_FEE_BPS).toBe(1000n);
    expect(BPS_DENOMINATOR).toBe(10000n);
  });

  it('fee math: 5% of 100 = 5', () => {
    const amount = 100n;
    const fee = (amount * CREATION_FEE_BPS) / BPS_DENOMINATOR;
    expect(fee).toBe(5n);
  });

  it('fee math: 10% of 100 = 10', () => {
    const amount = 100n;
    const fee = (amount * PAYOUT_FEE_BPS) / BPS_DENOMINATOR;
    expect(fee).toBe(10n);
  });
});
