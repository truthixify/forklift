// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Post, Get, Patch, Param, Body, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PrismaService } from '@forklift/database';
import { AgentWalletService } from '@forklift/kite-identity';
import type { Prisma } from '@prisma/client';

@ApiTags('operators')
@Controller('operators')
export class OperatorsController {
  private readonly logger = new Logger(OperatorsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentWallet: AgentWalletService,
  ) {}

  @Post('agents')
  async createAgent(
    @Body()
    body: {
      operatorAddress: string;
      name: string;
      displayName: string;
      specialization: Record<string, unknown>;
      aiProvider?: { provider: string; model: string };
      spendCaps?: { perTaskUSDT: string; globalDailyUSDT: string };
    },
  ) {
    // Generate agent keypair + AA wallet
    const wallet = this.agentWallet.generateAgentWallet(body.operatorAddress);

    // Ensure operator exists as a user
    await this.prisma.user.upsert({
      where: { passportAddress: body.operatorAddress },
      update: {},
      create: { passportAddress: body.operatorAddress },
    });

    const profileConfig = {
      signerAddress: wallet.signerAddress,
      aaWalletAddress: wallet.aaWalletAddress,
      encryptedSignerKey: wallet.encryptedSignerKey,
      specialization: body.specialization,
      spendCaps: body.spendCaps ?? {
        perTaskUSDT: '2000000000000000000',
        globalDailyUSDT: '20000000000000000000',
      },
    };

    const agent = await this.prisma.workerAgent.create({
      data: {
        passportAddress: wallet.aaWalletAddress,
        operatorAddress: body.operatorAddress,
        name: body.name,
        displayName: body.displayName,
        profileConfig: profileConfig as unknown as Prisma.InputJsonValue,
        aiProviderConfig: (body.aiProvider ?? {
          provider: 'gemini',
          model: 'gemini-2.5-flash',
        }) as Prisma.InputJsonValue,
      },
    });

    this.logger.log(
      `Agent created: ${agent.name} (${wallet.aaWalletAddress}) for operator ${body.operatorAddress}`,
    );

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
  async listMyAgents(@Param('operatorAddress') operatorAddress: string) {
    const agents = await this.prisma.workerAgent.findMany({
      where: { operatorAddress },
    });
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
    @Body() body: { perTaskUSDT: string; globalDailyUSDT: string },
  ) {
    const agent = await this.prisma.workerAgent.findUnique({
      where: { passportAddress: address },
    });
    if (!agent) return { error: 'Agent not found' };

    const config = agent.profileConfig as Record<string, unknown>;
    config['spendCaps'] = body;

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
}
