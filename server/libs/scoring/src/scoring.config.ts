// Copyright 2025 Forklift. Apache-2.0 license.

export const SCORING_CONFIG = {
  weights: {
    relevance: 0.35,
    reliability: 0.30,
    proposalQuality: 0.25,
    freshness: 0.10,
  },
  rejectPenaltyMultiplier: 0.5,
  ghostPenaltyMultiplier: 1.0,
  disputeLossPenaltyMultiplier: 0.5,
  unknownDimDefault: 0.30,
  coldStartDefault: 0.5,
  probationThresholds: { tier1: 3, tier2: 10 },
  probationMultipliers: { tier1: 0.70, tier2: 0.90, full: 1.00 },
  cooldownGhostsInLast5: 2,
  cooldownDurationSec: 86_400,
  freshnessSteps: [
    [7, 1.0],
    [30, 0.8],
    [90, 0.5],
    [365, 0.3],
  ] as Array<[number, number]>,
  judgeTimeout: 5_000,
  judgeFailureFallback: 0.4,
  tieBreakEpsilon: 0.02,
  posterFrivolousThreshold: 0.5,
} as const;
