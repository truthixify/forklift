// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '@forklift/database';
import { SubgraphClient, type SubgraphBountyCreated } from '@forklift/chain';
import { ClaimService } from './claim.service';
import { DEMO_PROFILES } from './worker-profile';

@Injectable()
export class WorkerEventHandler implements OnModuleInit {
  private readonly logger = new Logger(WorkerEventHandler.name);
  private lastCheckedTimestamp = 0;
  private readonly processedBounties = new Set<string>();

  constructor(
    private readonly claimService: ClaimService,
    private readonly prisma: PrismaService,
    private readonly subgraph: SubgraphClient,
  ) {}

  onModuleInit() {
    this.lastCheckedTimestamp = Math.floor(Date.now() / 1000) - 3600;
    this.logger.log('Worker polling subgraph for new bounties');
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollForNewBounties() {
    const bounties = await this.subgraph.getRecentBountyCreateds(this.lastCheckedTimestamp);

    for (const bounty of bounties) {
      if (this.processedBounties.has(bounty.bountyId)) continue;
      this.processedBounties.add(bounty.bountyId);

      const ts = Number(bounty.timestamp_);
      if (ts > this.lastCheckedTimestamp) {
        this.lastCheckedTimestamp = ts;
      }

      await this.handleBountyCreated(bounty);
    }
  }

  private async handleBountyCreated(event: SubgraphBountyCreated) {
    const signature = await this.prisma.bountySignature.findFirst({
      where: { bountyId: event.bountyId },
    });

    const bountyInfo = {
      bountyId: event.bountyId,
      title: signature?.title ?? 'Unknown bounty',
      description: signature?.description ?? '',
      templateId: signature?.templateId ?? null,
      deliverableKind: this.extractDeliverableKind(signature?.deliverableSchema),
      amount: event.amountUSDT,
    };

    for (const profile of DEMO_PROFILES) {
      if (this.claimService.shouldClaim(profile, bountyInfo)) {
        this.logger.log(`${profile.displayName} claiming bounty ${event.bountyId}`);
        try {
          const proposal = await this.claimService.generateProposal(profile, bountyInfo);
          this.logger.log(
            `${profile.displayName} proposal: "${proposal.proposalText.slice(0, 80)}..." (ETA: ${proposal.etaMinutes}m)`,
          );
        } catch (error) {
          this.logger.error(`${profile.displayName} failed to claim ${event.bountyId}`, error);
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
