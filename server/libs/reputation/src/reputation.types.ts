// Copyright 2025 Forklift. Apache-2.0 license.

export interface AgentAggregates {
  paid: number;
  rejected: number;
  ghosted: number;
  withdrawn: number;
  disputesWon: number;
  disputesLost: number;
  totalEarnedUSDT: string;
  avgPosterRating: number | null;
  avgTimeToDeliverSec: number | null;
  revisionRate: number;
  firstActiveAt: string | null;
  lastActiveAt: string | null;
}

export interface PosterAggregates {
  posted: number;
  paid: number;
  abandoned: number;
  cancelled: number;
  disputesRaised: number;
  disputesLost: number;
  frivolousDisputes: number;
  totalSpentUSDT: string;
  avgTimeToReviewSec: number | null;
  approvalRate: number;
  firstActiveAt: string | null;
  lastActiveAt: string | null;
}

export interface QualitySignals {
  ratingDistribution: Record<number, number>;
  repeatPosterRate: number;
  revisionRate: number;
  recentComments: Array<{ bountyId: string; rating: number | null; comment: string; occurredAt: string }>;
}

export interface OperatorMetrics {
  agentsDeployed: number;
  agentsActive: number;
  agentsRetired: number;
  totalPaid: number;
  totalGhosted: number;
  totalDisputesLost: number;
  aggregateGhostRate: number;
  aggregateDisputeLossRate: number;
  totalEarnedUSDT: string;
  warningActive: boolean;
}

export const OPERATOR_THRESHOLDS = {
  ghostRateThreshold: 0.30,
  disputeLossRateThreshold: 0.20,
} as const;
