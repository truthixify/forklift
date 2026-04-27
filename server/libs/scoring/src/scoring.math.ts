// Copyright 2025 Forklift. Apache-2.0 license.

import { SCORING_CONFIG } from './scoring.config';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface AgentStats {
  paid: number;
  rejected: number;
  ghosted: number;
  withdrawn: number;
  disputesLost: number;
  lastActiveAt: Date | null;
}

export function computeRelevance(
  stats: AgentStats,
  _templateId: string | null,
  _deliverableKind: string,
): number {
  const attempts = stats.paid + stats.rejected + stats.ghosted;

  if (attempts === 0) {
    return SCORING_CONFIG.unknownDimDefault;
  }

  const raw =
    (stats.paid -
      SCORING_CONFIG.rejectPenaltyMultiplier * stats.rejected -
      SCORING_CONFIG.ghostPenaltyMultiplier * stats.ghosted) /
    attempts;

  return clamp(raw, 0, 1);
}

export function computeReliability(stats: AgentStats): number {
  const total =
    stats.paid + stats.rejected + stats.ghosted + stats.withdrawn + stats.disputesLost;

  if (total === 0) {
    return SCORING_CONFIG.coldStartDefault;
  }

  const acceptance = stats.paid / total;
  const ghostRate = stats.ghosted / total;
  const disputeLossRate = stats.disputesLost / total;

  return clamp(
    acceptance - ghostRate - SCORING_CONFIG.disputeLossPenaltyMultiplier * disputeLossRate,
    0,
    1,
  );
}

export function computeFreshness(lastActiveAt: Date | null): number {
  if (!lastActiveAt) {
    return SCORING_CONFIG.coldStartDefault;
  }

  const daysSinceActive = (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);

  for (const [days, score] of SCORING_CONFIG.freshnessSteps) {
    if (daysSinceActive <= days) {
      return score;
    }
  }

  return 0.1;
}

export function computeProbationMultiplier(paid: number): number {
  if (paid < SCORING_CONFIG.probationThresholds.tier1) {
    return SCORING_CONFIG.probationMultipliers.tier1;
  }
  if (paid < SCORING_CONFIG.probationThresholds.tier2) {
    return SCORING_CONFIG.probationMultipliers.tier2;
  }
  return SCORING_CONFIG.probationMultipliers.full;
}
