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
    const agents = await this.prisma.workerAgent.findMany({
      take: Math.min(Number(limit) || 50, 100),
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'desc' },
    });

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

    const metrics = await this.reputationService.computeOperatorMetrics(address);

    return { user, agents, metrics };
  }
}
