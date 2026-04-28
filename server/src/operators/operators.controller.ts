// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Post, Get, Patch, Param, Query, Body, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PrismaService } from '@forklift/database';
import { ReputationService } from '@forklift/reputation';
import { NotificationService } from '@forklift/notifications';
import { AgentWalletService } from '@forklift/kite-identity';
import type { Prisma } from '@prisma/client';

@ApiTags('operators')
@Controller('operators')
export class OperatorsController {
  private readonly logger = new Logger(OperatorsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentWallet: AgentWalletService,
    private readonly reputationService: ReputationService,
    private readonly notifications: NotificationService,
  ) {}

  @Post('agents')
  async createAgent(
    @Body()
    body: {
      operatorAddress: string;
      handle?: string;
      name?: string;
      displayName?: string;
      specializations?: string[];
      specialization?: Record<string, unknown>;
      provider?: string;
      apiKey?: string;
      aiProvider?: { provider: string; model: string };
      spendCaps?: { perTaskUSDT: string; globalDailyUSDT: string };
      prefund?: number;
    },
  ) {
    const agentName = body.handle ?? body.name ?? 'agent';
    const agentDisplayName = body.displayName ?? `${agentName.charAt(0).toUpperCase() + agentName.slice(1)}`;

    const wallet = this.agentWallet.generateAgentWallet(body.operatorAddress);

    await this.prisma.user.upsert({
      where: { passportAddress: body.operatorAddress },
      update: {},
      create: { passportAddress: body.operatorAddress },
    });

    const specTemplates = body.specializations?.map((s) => s.toLowerCase()) ?? [];
    const specialization = body.specialization ?? {
      templates: specTemplates,
      deliverableKinds: [],
      willStretch: true,
      claimThreshold: 0.5,
      minBountyUSDT: '100000000000000',
      maxBountyUSDT: '100000000000000000000',
    };

    const providerMap: Record<string, string> = {
      openai: 'gpt-4o-mini',
      anthropic: 'claude-haiku-4-5',
      google: 'gemini-2.5-flash',
      forklift: 'gemini-2.5-flash',
    };
    const providerAlias: Record<string, string> = { google: 'gemini', forklift: 'gemini' };
    const providerName = providerAlias[body.provider ?? ''] ?? body.provider ?? 'gemini';
    const aiProvider = body.aiProvider ?? {
      provider: providerName,
      model: providerMap[body.provider ?? 'forklift'] ?? 'gemini-2.5-flash',
    };

    const profileConfig = {
      signerAddress: wallet.signerAddress,
      aaWalletAddress: wallet.aaWalletAddress,
      encryptedSignerKey: wallet.encryptedSignerKey,
      specialization,
      spendCaps: body.spendCaps ?? {
        perTaskUSDT: '2500000000000000000',
        globalDailyUSDT: '50000000000000000000',
      },
    };

    const agent = await this.prisma.workerAgent.create({
      data: {
        passportAddress: wallet.aaWalletAddress,
        operatorAddress: body.operatorAddress,
        name: agentName,
        displayName: agentDisplayName,
        profileConfig: profileConfig as unknown as Prisma.InputJsonValue,
        aiProviderConfig: aiProvider as Prisma.InputJsonValue,
      },
    });

    this.logger.log(
      `Agent created: ${agent.name} (${wallet.aaWalletAddress}) for operator ${body.operatorAddress}`,
    );

    await this.notifications.notify({
      userAddress: body.operatorAddress,
      category: 'agent.assigned',
      title: 'Agent deployed',
      body: `${agentDisplayName} is live and listening for bounties.`,
      payload: { agentAddress: agent.passportAddress },
      ctaLabel: 'View agents',
      ctaHref: '/dashboard/operator/agents',
    });

    return {
      agent: {
        passportAddress: agent.passportAddress,
        name: agent.name,
        displayName: agent.displayName,
        signerAddress: wallet.signerAddress,
        aaWalletAddress: wallet.aaWalletAddress,
        status: agent.status,
      },
    };
  }

  @Get('me/agents')
  async listMyAgents(@Query('address') operatorAddress?: string) {
    const where = operatorAddress ? { operatorAddress } : {};
    const raw = await this.prisma.workerAgent.findMany({ where });

    const agents = await Promise.all(
      raw.map(async (a) => {
        let agg;
        let signals;
        try {
          agg = await this.reputationService.getAgentAggregates(a.passportAddress);
          signals = await this.reputationService.getQualitySignals(a.passportAddress);
        } catch {
          agg = { paid: 0, rejected: 0, ghosted: 0, withdrawn: 0, disputesWon: 0, disputesLost: 0, totalEarnedUSDT: '0', avgPosterRating: null, avgTimeToDeliverSec: null, revisionRate: 0, firstActiveAt: null, lastActiveAt: null };
          signals = { ratingDistribution: {}, repeatPosterRate: 0, revisionRate: 0, recentComments: [] };
        }

        const config = a.profileConfig as Record<string, unknown> | null;
        const spec = (config?.specialization as Record<string, unknown>) ?? {};
        const templates = (spec.templates as string[]) ?? [];
        const kinds = (spec.deliverableKinds as string[]) ?? [];

        const rawName = a.displayName || a.name;
        const cleanName = rawName.replace(/^Forklift\s*·\s*/i, '');

        return {
          id: a.passportAddress,
          handle: cleanName,
          monogram: cleanName.charAt(0).toUpperCase(),
          wallet: a.passportAddress,
          specializations: [...templates, ...kinds].map((s) => s.toUpperCase()),
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
          status: a.status,
          spendCaps: (config?.spendCaps as Record<string, string>) ?? { perTaskUSDT: '2500000000000000000', globalDailyUSDT: '50000000000000000000' },
          minBountyUSDT: (spec.minBountyUSDT as string) ?? '100000000000000',
          maxBountyUSDT: (spec.maxBountyUSDT as string) ?? '100000000000000000000',
          todaySpend: await this.getTodaySpend(a.passportAddress),
        };
      }),
    );

    return { agents };
  }

  @Patch('agents/:address/ai-config')
  async updateAIConfig(
    @Param('address') address: string,
    @Body() body: { provider: string; model: string },
  ) {
    const agent = await this.prisma.workerAgent.update({
      where: { passportAddress: address },
      data: { aiProviderConfig: body as Prisma.InputJsonValue },
    });
    return { agent };
  }

  @Patch('agents/:address/spend-caps')
  async updateSpendCaps(
    @Param('address') address: string,
    @Body() body: { perTaskUSDT: string; globalDailyUSDT: string; minBountyUSDT?: string; maxBountyUSDT?: string },
  ) {
    const agent = await this.prisma.workerAgent.findUnique({
      where: { passportAddress: address },
    });
    if (!agent) return { error: 'Agent not found' };

    const config = agent.profileConfig as Record<string, unknown>;
    config['spendCaps'] = { perTaskUSDT: body.perTaskUSDT, globalDailyUSDT: body.globalDailyUSDT };

    if (body.minBountyUSDT || body.maxBountyUSDT) {
      const spec = (config.specialization as Record<string, unknown>) ?? {};
      if (body.minBountyUSDT) spec.minBountyUSDT = body.minBountyUSDT;
      if (body.maxBountyUSDT) spec.maxBountyUSDT = body.maxBountyUSDT;
      config.specialization = spec;
    }

    const updated = await this.prisma.workerAgent.update({
      where: { passportAddress: address },
      data: { profileConfig: config as Prisma.InputJsonValue },
    });
    return { agent: updated };
  }

  @Post('agents/:address/pause')
  async pauseAgent(@Param('address') address: string) {
    const agent = await this.prisma.workerAgent.update({
      where: { passportAddress: address },
      data: { status: 'paused' },
    });
    return { agent };
  }

  @Post('agents/:address/resume')
  async resumeAgent(@Param('address') address: string) {
    const agent = await this.prisma.workerAgent.update({
      where: { passportAddress: address },
      data: { status: 'active' },
    });
    return { agent };
  }

  @Post('agents/:address/retire')
  async retireAgent(@Param('address') address: string) {
    const agent = await this.prisma.workerAgent.update({
      where: { passportAddress: address },
      data: { status: 'retired' },
    });
    return { agent };
  }

  @Post('agents/:address/withdraw')
  async withdrawEarnings(
    @Param('address') address: string,
    @Body() body: { operatorAddress: string; amount: string },
  ) {
    const agent = await this.prisma.workerAgent.findUnique({
      where: { passportAddress: address },
    });
    if (!agent) return { error: 'Agent not found' };
    if (agent.operatorAddress !== body.operatorAddress) return { error: 'Not your agent' };

    this.logger.log(`Withdraw ${body.amount} from ${address} to ${body.operatorAddress}`);

    return {
      withdrawn: true,
      agentAddress: address,
      operatorAddress: body.operatorAddress,
      amount: body.amount,
    };
  }

  @Get('earnings/:operatorAddress')
  async getEarnings(@Param('operatorAddress') operatorAddress: string) {
    const agents = await this.prisma.workerAgent.findMany({
      where: { operatorAddress },
      select: { passportAddress: true, name: true, displayName: true },
    });

    const agentAddresses = agents.map((a) => a.passportAddress);

    const records = await this.prisma.bountyRecord.findMany({
      where: { party: { in: agentAddresses }, side: 'agent', outcome: 'paid' },
      orderBy: { occurredAt: 'desc' },
    });

    const dailyMap = new Map<string, number>();
    let lifetime = 0;
    for (const r of records) {
      const day = r.occurredAt.toISOString().slice(0, 10);
      const net = Number(r.netUsdt.toString()) / 1e18;
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + net);
      lifetime += net;
    }

    const today = new Date();
    const daily: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      daily.push(dailyMap.get(key) ?? 0);
    }

    const perAgent = agents.map((a) => {
      const agentRecords = records.filter((r) => r.party === a.passportAddress);
      const total = agentRecords.reduce((sum, r) => sum + Number(r.netUsdt.toString()) / 1e18, 0);
      return { address: a.passportAddress, name: a.displayName || a.name, total };
    });

    return {
      daily,
      lifetime,
      withdrawable: lifetime,
      perAgent,
    };
  }

  private async getTodaySpend(agentAddress: string): Promise<number> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const payments = await this.prisma.x402Payment.findMany({
      where: { agentAddress, paidAt: { gte: todayStart } },
    });

    const totalWei = payments.reduce(
      (sum, p) => sum + BigInt(p.amountUsdt.toString()),
      0n,
    );

    return Number(totalWei) / 1e18;
  }
}
