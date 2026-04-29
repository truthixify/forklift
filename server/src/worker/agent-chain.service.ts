// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { encodeFunctionData } from 'viem';

import { PrismaService } from '@forklift/database';
import { AgentWalletService } from '@forklift/kite-identity';
import { BOUNTY_ESCROW_ABI } from '@forklift/chain';

@Injectable()
export class AgentChainService {
  private readonly logger = new Logger(AgentChainService.name);
  private readonly escrowAddress: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly agentWallet: AgentWalletService,
  ) {
    this.escrowAddress = this.config.get<string>('BOUNTY_ESCROW_ADDRESS') ?? '';
  }

  async submitClaimOnChain(agentAddress: string, bountyId: string, proposalHash: string): Promise<string | null> {
    const agent = await this.prisma.workerAgent.findUnique({ where: { passportAddress: agentAddress } });
    if (!agent) {
      this.logger.warn(`Agent ${agentAddress} not found — skipping on-chain claim`);
      return null;
    }

    const config = agent.profileConfig as Record<string, unknown>;
    const encryptedKey = config.encryptedSignerKey as string;
    if (!encryptedKey || !this.escrowAddress) {
      this.logger.warn(`Missing signer key or escrow address — skipping on-chain claim for ${agentAddress}`);
      return null;
    }

    const callData = encodeFunctionData({
      abi: BOUNTY_ESCROW_ABI,
      functionName: 'submitClaim',
      args: [bountyId as `0x${string}`, proposalHash as `0x${string}`, []],
    });

    try {
      const txResult = await this.agentWallet.sendAgentTransaction(
        encryptedKey,
        agent.operatorAddress,
        this.escrowAddress,
        0n,
        callData,
      );
      this.logger.log(`Agent ${agentAddress.slice(0, 12)} submitted claim on-chain for ${bountyId.slice(0, 14)}…`);
      return txResult;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`On-chain claim failed for ${agentAddress.slice(0, 12)}: ${msg}`);
      return null;
    }
  }

  async submitDeliveryOnChain(agentAddress: string, bountyId: string, deliveryHash: string): Promise<string | null> {
    const agent = await this.prisma.workerAgent.findUnique({ where: { passportAddress: agentAddress } });
    if (!agent) {
      this.logger.warn(`Agent ${agentAddress} not found — skipping on-chain delivery`);
      return null;
    }

    const config = agent.profileConfig as Record<string, unknown>;
    const encryptedKey = config.encryptedSignerKey as string;
    if (!encryptedKey || !this.escrowAddress) {
      this.logger.warn(`Missing signer key or escrow address — skipping on-chain delivery for ${agentAddress}`);
      return null;
    }

    const callData = encodeFunctionData({
      abi: BOUNTY_ESCROW_ABI,
      functionName: 'submitDelivery',
      args: [bountyId as `0x${string}`, deliveryHash as `0x${string}`],
    });

    try {
      const txResult = await this.agentWallet.sendAgentTransaction(
        encryptedKey,
        agent.operatorAddress,
        this.escrowAddress,
        0n,
        callData,
      );
      this.logger.log(`Agent ${agentAddress.slice(0, 12)} submitted delivery on-chain for ${bountyId.slice(0, 14)}…`);
      return txResult;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`On-chain delivery failed for ${agentAddress.slice(0, 12)}: ${msg}`);
      return null;
    }
  }
}
