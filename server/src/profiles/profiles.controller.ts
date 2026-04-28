// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PrismaService } from '@forklift/database';
import { ReputationService } from '@forklift/reputation';

@ApiTags('agents', 'posters', 'operators')
@Controller()
export class ProfilesController {

  constructor(
    private readonly prisma: PrismaService,
    private readonly reputationService: ReputationService,
  ) {}

  @Get('agents')
  async listAgents(
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
  ) {
    const raw = await this.prisma.workerAgent.findMany({
      take: Math.min(Number(limit) || 50, 100),
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'desc' },
    });

    const agents = await Promise.all(
      raw.map(async (a) => {
        const agg = await this.reputationService.getAgentAggregates(a.passportAddress);
        const signals = await this.reputationService.getQualitySignals(a.passportAddress);
        const config = a.profileConfig as Record<string, unknown> | null;
        const spec = (config?.specialization as Record<string, unknown>) ?? {};
        const templates = (spec.templates as string[]) ?? [];
        const kinds = (spec.deliverableKinds as string[]) ?? [];
        const specializations = [...templates, ...kinds].map((s) => s.toUpperCase());

        return {
          id: a.passportAddress,
          handle: a.displayName || a.name,
          monogram: (a.displayName || a.name).charAt(0).toUpperCase(),
          wallet: a.passportAddress,
          specializations,
          paid: agg.paid,
          rating: agg.avgPosterRating ?? 0,
          earnings: Number(agg.totalEarnedUSDT) / 1e18,
          active: a.status === 'active',
          probation: agg.paid < 3,
          joined: a.createdAt.toISOString().slice(0, 7),
          avgTime: agg.avgTimeToDeliverSec != null
            ? `${String(Math.floor(agg.avgTimeToDeliverSec / 60)).padStart(2, '0')}:${String(Math.round(agg.avgTimeToDeliverSec % 60)).padStart(2, '0')}`
            : '—',
          revisionRate: agg.revisionRate,
          repeatPosters: signals.repeatPosterRate,
          bio: (config?.bio as string) ?? '',
          operator: a.operatorAddress,
        };
      }),
    );

    return { agents };
  }

  @Get('agents/:address')
  async getAgentProfile(
    @Param('address') address: string,
    @Query('templateId') templateId?: string,
    @Query('deliverableKind') deliverableKind?: string,
    @Query('sinceDays') sinceDays?: string,
  ) {
    const agent = await this.prisma.workerAgent.findUnique({
      where: { passportAddress: address },
    });

    const aggregates = await this.reputationService.getAgentAggregates(address, {
      templateId,
      deliverableKind,
      sinceDays: sinceDays ? Number(sinceDays) : undefined,
    });

    const signals = await this.reputationService.getQualitySignals(address);

    const recentBounties = await this.prisma.bountyRecord.findMany({
      where: { party: address, side: 'agent' },
      orderBy: { occurredAt: 'desc' },
      take: 10,
    });

    return { agent, aggregates, signals, recentBounties };
  }

  @Get('posters/:address')
  async getPosterProfile(
    @Param('address') address: string,
    @Query('sinceDays') sinceDays?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { passportAddress: address },
    });

    const aggregates = await this.reputationService.getPosterAggregates(address, {
      sinceDays: sinceDays ? Number(sinceDays) : undefined,
    });

    const recentBounties = await this.prisma.bountyRecord.findMany({
      where: { party: address, side: 'poster' },
      orderBy: { occurredAt: 'desc' },
      take: 10,
    });

    return { user, aggregates, recentBounties };
  }

  @Get('operators/:address')
  async getOperatorProfile(@Param('address') address: string) {
    const user = await this.prisma.user.findUnique({
      where: { passportAddress: address },
    });

    const agents = await this.prisma.workerAgent.findMany({
      where: { operatorAddress: address },
    });

    let metrics;
    try {
      metrics = await this.reputationService.computeOperatorMetrics(address);
    } catch {
      metrics = {
        agentsDeployed: agents.length,
        agentsActive: agents.filter((a) => a.status === 'active').length,
        agentsRetired: 0,
        totalPaid: 0,
        totalGhosted: 0,
        totalDisputesLost: 0,
        aggregateGhostRate: 0,
        aggregateDisputeLossRate: 0,
        totalEarnedUSDT: '0',
        warningActive: false,
      };
    }

    return { user, agents, metrics };
  }
}
