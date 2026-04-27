// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PublicClient, Transport, Chain } from 'viem';

import { PrismaService } from '@forklift/database';
import {
  createKiteWsClient,
  createKitePublicClient,
  BOUNTY_ESCROW_ABI,
  parseEscrowLog,
} from '@forklift/chain';
import { ClaimService } from './claim.service';
import { DEMO_PROFILES } from './worker-profile';

@Injectable()
export class WorkerEventHandler implements OnModuleInit {
  private readonly logger = new Logger(WorkerEventHandler.name);

  constructor(
    private readonly claimService: ClaimService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const escrowAddress = this.config.get<string>('BOUNTY_ESCROW_ADDRESS');
    if (!escrowAddress) {
      this.logger.warn('BOUNTY_ESCROW_ADDRESS not set; worker event handler disabled');
      return;
    }

    this.watchBountyCreated(escrowAddress as `0x${string}`);
  }

  private watchBountyCreated(address: `0x${string}`) {
    let client: PublicClient<Transport, Chain>;
    try {
      client = createKiteWsClient();
    } catch {
      this.logger.warn('WS failed for worker, falling back to HTTP');
      client = createKitePublicClient();
    }

    client.watchContractEvent({
      address,
      abi: BOUNTY_ESCROW_ABI,
      eventName: 'BountyCreated',
      onLogs: (logs) => {
        for (const log of logs) {
          const parsed = parseEscrowLog(log);
          if (parsed?.eventName === 'BountyCreated') {
            void this.handleBountyCreated(parsed.args as Record<string, unknown>);
          }
        }
      },
      onError: (error) => {
        this.logger.error('Worker event watcher error', error);
      },
    });

    this.logger.log('Worker watching for BountyCreated events');
  }

  private async handleBountyCreated(args: Record<string, unknown>) {
    const bountyId = args['bountyId'] as string;
    const amount = String(args['amountUSDT'] ?? '0');

    const signature = await this.prisma.bountySignature.findFirst({
      where: { bountyId },
    });

    const bountyInfo = {
      bountyId,
      title: signature?.title ?? 'Unknown bounty',
      description: signature?.description ?? '',
      templateId: signature?.templateId ?? null,
      deliverableKind: this.extractDeliverableKind(signature?.deliverableSchema),
      amount,
    };

    for (const profile of DEMO_PROFILES) {
      if (this.claimService.shouldClaim(profile, bountyInfo)) {
        this.logger.log(`${profile.displayName} claiming bounty ${bountyId}`);
        try {
          const proposal = await this.claimService.generateProposal(profile, bountyInfo);
          this.logger.log(
            `${profile.displayName} proposal: "${proposal.proposalText.slice(0, 80)}..." (ETA: ${proposal.etaMinutes}m)`,
          );
        } catch (error) {
          this.logger.error(`${profile.displayName} failed to claim ${bountyId}`, error);
        }
      }
    }
  }

  private extractDeliverableKind(schema: unknown): string {
    if (schema && typeof schema === 'object' && 'payload' in (schema as Record<string, unknown>)) {
      const payload = (schema as Record<string, unknown>)['payload'];
      if (payload && typeof payload === 'object' && 'kind' in (payload as Record<string, unknown>)) {
        return (payload as Record<string, unknown>)['kind'] as string;
      }
    }
    return 'json';
  }
}
