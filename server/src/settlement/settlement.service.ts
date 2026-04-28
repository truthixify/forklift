// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '@forklift/database';
import { NotificationService } from '@forklift/notifications';
import {
  createBrokerWalletClient,
  signRelease,
  signRefund,
  hashData,
  BOUNTY_ESCROW_ABI,
  kiteTestnet,
} from '@forklift/chain';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationService,
  ) {}

  async release(bountyId: string, agentAddress: string, reason: string): Promise<string | null> {
    const settlementData = { action: 'release', bountyId, agentAddress, reason, at: Date.now() };
    const settlementHash = hashData(JSON.stringify(settlementData));

    const brokerKey = this.config.get<string>('BROKER_PRIVATE_KEY');
    const escrowAddress = this.config.get<string>('BOUNTY_ESCROW_ADDRESS');

    if (!brokerKey || !escrowAddress) {
      this.logger.warn('Missing broker key or escrow address; skipping on-chain release');
      return null;
    }

    const walletClient = createBrokerWalletClient(brokerKey as `0x${string}`);
    const signature = await signRelease(
      walletClient,
      escrowAddress as `0x${string}`,
      bountyId as `0x${string}`,
      agentAddress as `0x${string}`,
      settlementHash as `0x${string}`,
    );

    try {
      const txHash = await walletClient.writeContract({
        address: escrowAddress as `0x${string}`,
        abi: BOUNTY_ESCROW_ABI,
        functionName: 'release',
        args: [
          bountyId as `0x${string}`,
          agentAddress as `0x${string}`,
          settlementHash as `0x${string}`,
          signature,
        ],
        chain: kiteTestnet,
        account: walletClient.account!,
      });

      this.logger.log(`Release tx: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(`Release failed for ${bountyId}: ${this.parseContractError(error)}`);
      return null;
    }
  }

  async refund(bountyId: string, reason: number, description: string): Promise<string | null> {
    const settlementData = { action: 'refund', bountyId, reason, description, at: Date.now() };
    const settlementHash = hashData(JSON.stringify(settlementData));

    const brokerKey = this.config.get<string>('BROKER_PRIVATE_KEY');
    const escrowAddress = this.config.get<string>('BOUNTY_ESCROW_ADDRESS');

    if (!brokerKey || !escrowAddress) {
      this.logger.warn('Missing broker key or escrow address; skipping on-chain refund');
      return null;
    }

    const walletClient = createBrokerWalletClient(brokerKey as `0x${string}`);
    const signature = await signRefund(
      walletClient,
      escrowAddress as `0x${string}`,
      bountyId as `0x${string}`,
      settlementHash as `0x${string}`,
      reason,
    );

    try {
      const txHash = await walletClient.writeContract({
        address: escrowAddress as `0x${string}`,
        abi: BOUNTY_ESCROW_ABI,
        functionName: 'refund',
        args: [
          bountyId as `0x${string}`,
          settlementHash as `0x${string}`,
          reason,
          signature,
        ],
        chain: kiteTestnet,
        account: walletClient.account!,
      });

      this.logger.log(`Refund tx: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(`Refund failed for ${bountyId}: ${this.parseContractError(error)}`);
      return null;
    }
  }

  async recordBountyOutcome(args: {
    bountyId: string;
    agentAddress: string;
    posterAddress: string;
    outcome: string;
    brokerDecision: string | null;
    posterDecision: string | null;
    platformDecision: string | null;
    amountUsdt: string;
    templateId: string | null;
    deliverableKind: string;
    verifierType: string;
    posterRating: number | null;
    posterComment: string | null;
  }) {
    const now = new Date();
    const gross = BigInt(args.amountUsdt);
    const fees = (gross * 1000n) / 10000n;
    const net = gross - fees;

    const agentRecord: Prisma.BountyRecordCreateInput = {
      bountyId: args.bountyId,
      side: 'agent',
      party: args.agentAddress,
      templateId: args.templateId,
      deliverableKind: args.deliverableKind,
      verifierType: args.verifierType,
      outcome: args.outcome,
      brokerDecision: args.brokerDecision,
      posterDecision: args.posterDecision,
      platformDecision: args.platformDecision,
      amountUsdt: args.amountUsdt,
      feesUsdt: fees.toString(),
      netUsdt: args.outcome === 'paid' ? net.toString() : '0',
      posterRating: args.posterRating,
      posterComment: args.posterComment,
      revisionCount: 0,
      occurredAt: now,
    };

    const posterRecord: Prisma.BountyRecordCreateInput = {
      bountyId: args.bountyId,
      side: 'poster',
      party: args.posterAddress,
      templateId: args.templateId,
      deliverableKind: args.deliverableKind,
      verifierType: args.verifierType,
      outcome: args.outcome,
      brokerDecision: args.brokerDecision,
      posterDecision: args.posterDecision,
      platformDecision: args.platformDecision,
      amountUsdt: args.amountUsdt,
      feesUsdt: fees.toString(),
      netUsdt: args.outcome === 'paid' ? args.amountUsdt : '0',
      posterRating: null,
      posterComment: null,
      revisionCount: 0,
      occurredAt: now,
    };

    await this.prisma.bountyRecord.createMany({
      data: [agentRecord, posterRecord],
      skipDuplicates: true,
    });

    this.logger.log(`Recorded ${args.outcome} for bounty ${args.bountyId}`);

    if (args.outcome === 'paid') {
      await this.notifications.notify({
        userAddress: args.posterAddress,
        category: 'bounty.delivered',
        title: 'Bounty settled',
        body: `Bounty ${args.bountyId.slice(0, 10)}… settled. Agent paid.`,
        payload: { bountyId: args.bountyId },
        ctaLabel: 'View history',
        ctaHref: `/dashboard/poster/history`,
      });
      await this.notifications.notify({
        userAddress: args.agentAddress,
        category: 'agent.paid',
        title: 'Payment received',
        body: `You earned from bounty ${args.bountyId.slice(0, 10)}….`,
        payload: { bountyId: args.bountyId },
      });
    }

    if (args.outcome === 'rejected') {
      await this.notifications.notify({
        userAddress: args.agentAddress,
        category: 'agent.rejected',
        title: 'Delivery rejected',
        body: `Your delivery for ${args.bountyId.slice(0, 10)}… was rejected.`,
        payload: { bountyId: args.bountyId },
      });
    }
  }

  private parseContractError(error: unknown): string {
    if (!error || typeof error !== 'object') return String(error);
    const err = error as Record<string, unknown>;
    const cause = err.cause as Record<string, unknown> | undefined;
    const data = cause?.data as Record<string, unknown> | undefined;
    if (data?.errorName) {
      const args = Array.isArray(data.args) ? data.args.join(', ') : '';
      return `${data.errorName}(${args})`;
    }
    const short = (err.shortMessage ?? cause?.shortMessage) as string | undefined;
    if (short) return short;
    return (err.message as string) ?? String(error);
  }
}
