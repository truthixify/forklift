// Copyright 2025 Forklift. Apache-2.0 license.

export const BOUNTY_STATUS = {
  OPEN: 0,
  ASSIGNED: 1,
  DELIVERED: 2,
  PAID: 3,
  REFUNDED: 4,
  DISPUTED: 5,
  CANCELLED: 6,
} as const;

export type BountyStatus = (typeof BOUNTY_STATUS)[keyof typeof BOUNTY_STATUS];

export const BOUNTY_STATUS_LABELS: Record<BountyStatus, string> = {
  [BOUNTY_STATUS.OPEN]: 'open',
  [BOUNTY_STATUS.ASSIGNED]: 'assigned',
  [BOUNTY_STATUS.DELIVERED]: 'delivered',
  [BOUNTY_STATUS.PAID]: 'paid',
  [BOUNTY_STATUS.REFUNDED]: 'refunded',
  [BOUNTY_STATUS.DISPUTED]: 'disputed',
  [BOUNTY_STATUS.CANCELLED]: 'cancelled',
};

export const CREATION_FEE_BPS = 500n;
export const PAYOUT_FEE_BPS = 1000n;
export const BPS_DENOMINATOR = 10000n;

export const POSTER_DECISION_WINDOW_SEC = 7n * 24n * 60n * 60n; // 7 days
export const DEFAULT_CLAIM_WINDOW_SEC = 5n * 60n; // 5 min
export const MIN_CLAIM_WINDOW_SEC = 1n * 60n; // 1 min
export const MAX_CLAIM_WINDOW_SEC = 7n * 24n * 60n * 60n; // 7 days
