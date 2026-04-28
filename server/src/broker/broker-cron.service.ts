// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '@forklift/database';
import { ScoringService } from './scoring.service';
import { AssignmentService } from './assignment.service';
import { SettlementService } from '../settlement/settlement.service';

@Injectable()
export class BrokerCronService {
  private readonly logger = new Logger(BrokerCronService.name);
  private ticking = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: ScoringService,
    private readonly assignmentService: AssignmentService,
    private readonly settlementService: SettlementService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async tick() {
    if (this.ticking) return;
    this.ticking = true;
    try {
      await this.processClaimWindows();
      await this.processDeliveryDeadlines();
      await this.processPosterSilence();
    } finally {
      this.ticking = false;
    }
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

      const alreadyScored = await this.prisma.scoringTrace.findFirst({
        where: { bountyId },
      });
      if (alreadyScored) continue;

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

  private async processDeliveryDeadlines() {
    const assignedBounties = await this.prisma.indexedEvent.findMany({
      where: { eventName: 'BountyAssigned' },
    });

    for (const event of assignedBounties) {
      const bountyId = event.bountyId;
      if (!bountyId) continue;

      const delivered = await this.prisma.indexedEvent.findFirst({
        where: { bountyId, eventName: 'DeliverySubmitted' },
      });
      if (delivered) continue;

      const settled = await this.prisma.indexedEvent.findFirst({
        where: { bountyId, eventName: { in: ['BountyPaid', 'BountyRefunded'] } },
      });
      if (settled) continue;

      const data = event.data as Record<string, unknown>;
      const deadline = Number(data['deliveryDeadline'] ?? 0);
      if (deadline > 0 && Date.now() / 1000 > deadline) {
        this.logger.log(`Bounty ${bountyId} ghosted — delivery deadline passed`);
      }
    }
  }

  private async processPosterSilence() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const deliveredBounties = await this.prisma.indexedEvent.findMany({
      where: {
        eventName: 'DeliverySubmitted',
        indexedAt: { lt: sevenDaysAgo },
      },
    });

    for (const event of deliveredBounties) {
      const bountyId = event.bountyId;
      if (!bountyId) continue;

      const alreadySettled = await this.prisma.indexedEvent.findFirst({
        where: { bountyId, eventName: { in: ['BountyPaid', 'BountyRefunded'] } },
      });
      if (alreadySettled) continue;

      const hasDispute = await this.prisma.dispute.findUnique({ where: { bountyId } });
      if (hasDispute) continue;

      const verifierResult = await this.prisma.verifierResult.findFirst({
        where: { bountyId },
        orderBy: { recordedAt: 'desc' },
      });

      if (!verifierResult) continue;

      const delivery = await this.prisma.delivery.findFirst({
        where: { bountyId },
        orderBy: { submittedAt: 'desc' },
      });

      if (!delivery) continue;

      this.logger.log(`Poster silence on ${bountyId} — broker decision binding (${verifierResult.passed ? 'pass' : 'fail'})`);

      if (verifierResult.passed) {
        await this.settlementService.release(bountyId, delivery.agentAddress, 'poster-silence-broker-pass');
      } else {
        await this.settlementService.refund(bountyId, 3, 'poster-silence-broker-fail');
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
