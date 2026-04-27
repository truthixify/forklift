// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable } from '@nestjs/common';

import { PrismaService } from '@forklift/database';
import type { AgentAggregates, PosterAggregates, QualitySignals, OperatorMetrics } from './reputation.types';
import { OPERATOR_THRESHOLDS } from './reputation.types';

interface SliceFilter {
  templateId?: string;
  deliverableKind?: string;
  verifierType?: string;
  sinceDays?: number;
}

@Injectable()
export class ReputationService {

  constructor(private readonly prisma: PrismaService) {}

  async getAgentAggregates(agentAddress: string, filter?: SliceFilter): Promise<AgentAggregates> {
    const where = this.buildWhere(agentAddress, 'agent', filter);
    const records = await this.prisma.bountyRecord.findMany({ where });

    const agg: AgentAggregates = {
      paid: 0, rejected: 0, ghosted: 0, withdrawn: 0,
      disputesWon: 0, disputesLost: 0,
      totalEarnedUSDT: '0',
      avgPosterRating: null,
      avgTimeToDeliverSec: null,
      revisionRate: 0,
      firstActiveAt: null,
      lastActiveAt: null,
    };

    let totalEarned = 0n;
    let ratingSum = 0;
    let ratingCount = 0;
    let deliveryTimeSum = 0;
    let deliveryTimeCount = 0;
    let paidWithRevision = 0;

    for (const r of records) {
      switch (r.outcome) {
        case 'paid': agg.paid++; break;
        case 'rejected': agg.rejected++; break;
        case 'ghosted': agg.ghosted++; break;
        case 'withdrawn': agg.withdrawn++; break;
        case 'disputed-won': agg.disputesWon++; break;
        case 'disputed-lost': agg.disputesLost++; break;
      }

      if (r.outcome === 'paid' || r.outcome === 'disputed-won') {
        totalEarned += BigInt(r.netUsdt.toString());
      }

      if (r.posterRating !== null) {
        ratingSum += r.posterRating;
        ratingCount++;
      }

      if (r.timeToDeliverSec !== null) {
        deliveryTimeSum += r.timeToDeliverSec;
        deliveryTimeCount++;
      }

      if (r.outcome === 'paid' && r.revisionCount > 0) {
        paidWithRevision++;
      }

      const ts = r.occurredAt.toISOString();
      if (!agg.firstActiveAt || ts < agg.firstActiveAt) agg.firstActiveAt = ts;
      if (!agg.lastActiveAt || ts > agg.lastActiveAt) agg.lastActiveAt = ts;
    }

    agg.totalEarnedUSDT = totalEarned.toString();
    agg.avgPosterRating = ratingCount > 0 ? ratingSum / ratingCount : null;
    agg.avgTimeToDeliverSec = deliveryTimeCount > 0 ? deliveryTimeSum / deliveryTimeCount : null;
    agg.revisionRate = agg.paid > 0 ? paidWithRevision / agg.paid : 0;

    return agg;
  }

  async getPosterAggregates(posterAddress: string, filter?: SliceFilter): Promise<PosterAggregates> {
    const where = this.buildWhere(posterAddress, 'poster', filter);
    const records = await this.prisma.bountyRecord.findMany({ where });

    const agg: PosterAggregates = {
      posted: 0, paid: 0, abandoned: 0, cancelled: 0,
      disputesRaised: 0, disputesLost: 0, frivolousDisputes: 0,
      totalSpentUSDT: '0',
      avgTimeToReviewSec: null,
      approvalRate: 0,
      firstActiveAt: null,
      lastActiveAt: null,
    };

    let totalSpent = 0n;
    let reviewTimeSum = 0;
    let reviewTimeCount = 0;

    for (const r of records) {
      agg.posted++;

      switch (r.outcome) {
        case 'paid': agg.paid++; break;
        case 'ghosted': case 'withdrawn': agg.abandoned++; break;
        case 'disputed-won': agg.disputesRaised++; break;
        case 'disputed-lost':
          agg.disputesRaised++;
          agg.disputesLost++;
          agg.frivolousDisputes++;
          break;
      }

      if (r.outcome === 'paid') {
        totalSpent += BigInt(r.amountUsdt.toString());
      }

      if (r.timeToReviewSec !== null) {
        reviewTimeSum += r.timeToReviewSec;
        reviewTimeCount++;
      }

      const ts = r.occurredAt.toISOString();
      if (!agg.firstActiveAt || ts < agg.firstActiveAt) agg.firstActiveAt = ts;
      if (!agg.lastActiveAt || ts > agg.lastActiveAt) agg.lastActiveAt = ts;
    }

    agg.totalSpentUSDT = totalSpent.toString();
    agg.avgTimeToReviewSec = reviewTimeCount > 0 ? reviewTimeSum / reviewTimeCount : null;
    agg.approvalRate = agg.paid > 0 ? (agg.paid - agg.disputesLost) / agg.paid : 0;

    return agg;
  }

  async getQualitySignals(agentAddress: string): Promise<QualitySignals> {
    const records = await this.prisma.bountyRecord.findMany({
      where: { party: agentAddress, side: 'agent' },
      orderBy: { occurredAt: 'desc' },
    });

    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const posterCounts = new Map<string, number>();
    let paidWithRevision = 0;
    let paidTotal = 0;

    for (const r of records) {
      if (r.posterRating !== null) {
        ratingDist[r.posterRating] = (ratingDist[r.posterRating] ?? 0) + 1;
      }

      // Count per-poster bounties for repeat rate
      const bountyPosterRecords = await this.prisma.bountyRecord.findMany({
        where: { bountyId: r.bountyId, side: 'poster' },
        select: { party: true },
      });
      for (const pr of bountyPosterRecords) {
        posterCounts.set(pr.party, (posterCounts.get(pr.party) ?? 0) + 1);
      }

      if (r.outcome === 'paid') {
        paidTotal++;
        if (r.revisionCount > 0) paidWithRevision++;
      }
    }

    const repeatPosters = Array.from(posterCounts.values()).filter((c) => c > 1).length;
    const totalPosters = posterCounts.size;

    const withComments = records.filter(
      (r): r is typeof r & { posterComment: string } => r.posterComment !== null,
    );
    const recentComments = withComments.slice(0, 5).map((r) => ({
      bountyId: r.bountyId,
      rating: r.posterRating,
      comment: r.posterComment,
      occurredAt: r.occurredAt.toISOString(),
    }));

    return {
      ratingDistribution: ratingDist,
      repeatPosterRate: totalPosters > 0 ? repeatPosters / totalPosters : 0,
      revisionRate: paidTotal > 0 ? paidWithRevision / paidTotal : 0,
      recentComments,
    };
  }

  async computeOperatorMetrics(operatorAddress: string): Promise<OperatorMetrics> {
    const agents = await this.prisma.workerAgent.findMany({
      where: { operatorAddress },
      select: { passportAddress: true, status: true },
    });

    const metrics: OperatorMetrics = {
      agentsDeployed: agents.length,
      agentsActive: agents.filter((a) => a.status === 'active').length,
      agentsRetired: agents.filter((a) => a.status === 'retired').length,
      totalPaid: 0,
      totalGhosted: 0,
      totalDisputesLost: 0,
      aggregateGhostRate: 0,
      aggregateDisputeLossRate: 0,
      totalEarnedUSDT: '0',
      warningActive: false,
    };

    let totalEarned = 0n;
    let totalRejected = 0;

    for (const agent of agents) {
      const agg = await this.getAgentAggregates(agent.passportAddress);
      metrics.totalPaid += agg.paid;
      metrics.totalGhosted += agg.ghosted;
      metrics.totalDisputesLost += agg.disputesLost;
      totalRejected += agg.rejected;
      totalEarned += BigInt(agg.totalEarnedUSDT);
    }

    metrics.totalEarnedUSDT = totalEarned.toString();

    const totalAttempts = metrics.totalPaid + metrics.totalGhosted + totalRejected;
    metrics.aggregateGhostRate = totalAttempts > 0 ? metrics.totalGhosted / totalAttempts : 0;

    const payPlusDispute = metrics.totalPaid + metrics.totalDisputesLost;
    metrics.aggregateDisputeLossRate = payPlusDispute > 0 ? metrics.totalDisputesLost / payPlusDispute : 0;

    metrics.warningActive =
      metrics.aggregateGhostRate > OPERATOR_THRESHOLDS.ghostRateThreshold ||
      metrics.aggregateDisputeLossRate > OPERATOR_THRESHOLDS.disputeLossRateThreshold;

    // Persist the computed aggregate
    await this.prisma.operatorAggregate.upsert({
      where: { operatorAddress },
      update: {
        agentsDeployed: metrics.agentsDeployed,
        agentsActive: metrics.agentsActive,
        agentsRetired: metrics.agentsRetired,
        totalPaid: metrics.totalPaid,
        totalGhosted: metrics.totalGhosted,
        totalDisputesLost: metrics.totalDisputesLost,
        aggregateGhostRate: metrics.aggregateGhostRate,
        aggregateDisputeLossRate: metrics.aggregateDisputeLossRate,
        totalEarnedUsdt: metrics.totalEarnedUSDT,
        warningActive: metrics.warningActive,
        computedAt: new Date(),
      },
      create: {
        operatorAddress,
        agentsDeployed: metrics.agentsDeployed,
        agentsActive: metrics.agentsActive,
        agentsRetired: metrics.agentsRetired,
        totalPaid: metrics.totalPaid,
        totalGhosted: metrics.totalGhosted,
        totalDisputesLost: metrics.totalDisputesLost,
        aggregateGhostRate: metrics.aggregateGhostRate,
        aggregateDisputeLossRate: metrics.aggregateDisputeLossRate,
        totalEarnedUsdt: metrics.totalEarnedUSDT,
        warningActive: metrics.warningActive,
      },
    });

    return metrics;
  }

  private buildWhere(party: string, side: string, filter?: SliceFilter) {
    const where: Record<string, unknown> = { party, side };

    if (filter?.templateId) where['templateId'] = filter.templateId;
    if (filter?.deliverableKind) where['deliverableKind'] = filter.deliverableKind;
    if (filter?.verifierType) where['verifierType'] = filter.verifierType;
    if (filter?.sinceDays) {
      where['occurredAt'] = { gte: new Date(Date.now() - filter.sinceDays * 86400000) };
    }

    return where;
  }
}
