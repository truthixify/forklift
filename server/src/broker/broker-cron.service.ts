// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '@forklift/database';
import { ScoringService } from './scoring.service';
import { AssignmentService } from './assignment.service';

@Injectable()
export class BrokerCronService {
  private readonly logger = new Logger(BrokerCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: ScoringService,
    private readonly assignmentService: AssignmentService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async tick() {
    await this.processClaimWindows();
  }

  private async processClaimWindows() {
    const openBounties = await this.prisma.indexedEvent.findMany({
      where: { eventName: 'BountyCreated' },
      orderBy: { indexedAt: 'asc' },
    });

    for (const bountyEvent of openBounties) {
      const bountyId = bountyEvent.bountyId;
      if (!bountyId) continue;

      const alreadyAssigned = await this.prisma.indexedEvent.findFirst({
        where: { bountyId, eventName: 'BountyAssigned' },
      });
      if (alreadyAssigned) continue;

      const alreadyExpired = await this.prisma.indexedEvent.findFirst({
        where: { bountyId, eventName: { in: ['BountyExpired', 'BountyCancelled', 'BountyRefunded'] } },
      });
      if (alreadyExpired) continue;

      const claims = await this.prisma.proposal.findMany({
        where: { bountyId },
      });

      if (claims.length === 0) continue;

      const createdAt = bountyEvent.indexedAt;
      const claimWindowSec = 300; // 5 minutes default
      const windowEnd = new Date(createdAt.getTime() + claimWindowSec * 1000);

      if (new Date() < windowEnd) continue;

      this.logger.log(`Claim window closed for ${bountyId}, scoring ${claims.length} claims`);

      const signature = await this.prisma.bountySignature.findFirst({
        where: { bountyId },
      });

      const candidates = claims.map((c) => ({
        agentAddress: c.agentAddress,
        proposalText: c.proposalText,
        assertedDimensions: c.assertedDimensions,
        etaMinutes: c.etaMinutes,
      }));

      try {
        const scored = await this.scoringService.scoreClaims(
          bountyId,
          signature?.title ?? '',
          signature?.description ?? '',
          signature?.templateId ?? null,
          this.extractDeliverableKind(signature?.deliverableSchema),
          candidates,
        );

        await this.assignmentService.assignBounty(bountyId as `0x${string}`, scored);
        this.logger.log(`Assigned bounty ${bountyId} to ${scored[0]?.agentAddress}`);
      } catch (error) {
        this.logger.error(`Failed to score/assign bounty ${bountyId}`, error);
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
