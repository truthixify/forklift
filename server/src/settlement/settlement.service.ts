// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '@forklift/database';
import { NotificationService } from '@forklift/notifications';
import {
  createBrokerWalletClient,
  createKitePublicClient,
  signRelease,
  signRefund,
  hashData,
  BOUNTY_ESCROW_ABI,
  kiteTestnet,
} from '@forklift/chain';

@Injectable()
export class SettlementService implements OnModuleInit {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationService,
  ) {}

  async onModuleInit() {
    await this.backfillZeroEarnings();
  }

  private async backfillZeroEarnings() {
    const zeroRecords = await this.prisma.bountyRecord.findMany({
      where: { outcome: 'paid', netUsdt: 0 },
    });

    for (const r of zeroRecords) {
      const createdEvent = await this.prisma.indexedEvent.findFirst({
        where: { bountyId: r.bountyId, eventName: 'BountyCreated' },
      });
      const evData = (createdEvent?.data as Record<string, unknown>) ?? {};
      const amountStr = (evData.amountUSDT as string) ?? '0';
      if (amountStr === '0') continue;

      const gross = BigInt(amountStr);
      const fees = (gross * 1000n) / 10000n;
      const net = gross - fees;

      await this.prisma.bountyRecord.update({
        where: { bountyId_side_party: { bountyId: r.bountyId, side: r.side, party: r.party } },
        data: {
          amountUsdt: amountStr,
          feesUsdt: fees.toString(),
          netUsdt: r.side === 'agent' ? net.toString() : amountStr,
        },
      });
      this.logger.log(`Backfilled earnings for ${r.bountyId.slice(0, 14)}… (${r.side}): ${Number(net) / 1e18} USDT`);
    }

    if (zeroRecords.length > 0) {
      this.logger.log(`Backfilled ${zeroRecords.length} bounty records with correct amounts`);
    }
  }

  async release(bountyId: string, agentAddress: string, reason: string): Promise<string | null> {
    const settlementData = { action: 'release', bountyId, agentAddress, reason, at: Date.now() };
    const settlementHash = hashData(JSON.stringify(settlementData));

    const brokerKey = this.config.get<string>('BROKER_PRIVATE_KEY');
    const escrowAddress = this.config.get<string>('BOUNTY_ESCROW_ADDRESS');

    if (!brokerKey || !escrowAddress) {
      this.logger.warn('Missing broker key or escrow address; skipping on-chain release');
      return null;
    }

    // Check on-chain status before attempting release
    const publicClient = createKitePublicClient();
    const onChain = await publicClient.readContract({
      address: escrowAddress as `0x${string}`,
      abi: BOUNTY_ESCROW_ABI,
      functionName: 'bounties',
      args: [bountyId as `0x${string}`],
    });
    const fields = onChain as unknown as readonly unknown[];
    const onChainStatus = Number(fields[6] ?? 0);
    // 0=Open, 1=Assigned, 2=Delivered, 3=Paid, 4=Refunded, 5=Cancelled
    if (onChainStatus === 3 || onChainStatus === 4) {
      this.logger.warn(`Bounty ${bountyId.slice(0, 14)}… already settled on-chain (status ${onChainStatus})`);
      return null;
    }
    if (onChainStatus !== 2) {
      this.logger.warn(`Bounty ${bountyId.slice(0, 14)}… not in delivered state on-chain (status ${onChainStatus}), skipping release`);
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
      // Agent might not have a user row — notify the operator instead
      const agent = await this.prisma.workerAgent.findUnique({ where: { passportAddress: args.agentAddress } });
      if (agent) {
        await this.notifications.notify({
          userAddress: agent.operatorAddress,
          category: 'agent.paid',
          title: 'Agent earned',
          body: `${agent.displayName} earned from bounty ${args.bountyId.slice(0, 10)}….`,
          payload: { bountyId: args.bountyId, agentAddress: args.agentAddress },
        });
      }
    }

    if (args.outcome === 'rejected') {
      const agent = await this.prisma.workerAgent.findUnique({ where: { passportAddress: args.agentAddress } });
      if (agent) {
        await this.notifications.notify({
          userAddress: agent.operatorAddress,
          category: 'agent.rejected',
          title: 'Delivery rejected',
          body: `${agent.displayName}'s delivery for ${args.bountyId.slice(0, 10)}… was rejected.`,
          payload: { bountyId: args.bountyId, agentAddress: args.agentAddress },
        });
      }
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
