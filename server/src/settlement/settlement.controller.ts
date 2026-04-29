// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Post, Param, Body, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { Prisma } from '@prisma/client';
import { PrismaService } from '@forklift/database';
import { hashData } from '@forklift/chain';
import { SettlementService } from './settlement.service';

@ApiTags('settlement')
@Controller('bounties')
export class SettlementController {
  private readonly logger = new Logger(SettlementController.name);

  constructor(
    private readonly settlementService: SettlementService,
    private readonly prisma: PrismaService,
  ) {}

  private async isAlreadySettled(bountyId: string): Promise<string | null> {
    const settled = await this.prisma.indexedEvent.findFirst({
      where: { bountyId, eventName: { in: ['BountyPaid', 'BountyRefunded'] } },
    });
    if (settled) return (settled.eventName === 'BountyPaid') ? 'paid' : 'refunded';
    return null;
  }

  private async getBountyContext(bountyId: string) {
    const signature = await this.prisma.bountySignature.findFirst({ where: { bountyId } });
    const createdEvent = await this.prisma.indexedEvent.findFirst({
      where: { bountyId, eventName: 'BountyCreated' },
    });
    const evData = (createdEvent?.data as Record<string, unknown>) ?? {};
    const delivery = await this.prisma.delivery.findFirst({
      where: { bountyId },
      orderBy: { submittedAt: 'desc' },
    });
    const verifierResult = await this.prisma.verifierResult.findFirst({
      where: { bountyId },
      orderBy: { recordedAt: 'desc' },
    });

    return {
      signature,
      delivery,
      verifierResult,
      amountUsdt: (evData.amountUSDT as string) ?? '0',
      templateId: signature?.templateId ?? null,
      deliverableKind: delivery?.payloadKind ?? 'json',
      verifierType: verifierResult?.verifierType ?? (signature?.verifierConfig as Record<string, unknown>)?.type as string ?? 'llm-judge',
    };
  }

  @Post(':bountyId/approve')
  async approve(
    @Param('bountyId') bountyId: string,
    @Body() body: { posterAddress: string; rating?: number; comment?: string },
  ) {
    try {
      const already = await this.isAlreadySettled(bountyId);
      if (already) throw new ConflictException(`Bounty already ${already}`);

      const ctx = await this.getBountyContext(bountyId);

      if (!ctx.delivery) throw new BadRequestException('No delivery found for this bounty');

      const txHash = await this.settlementService.release(bountyId, ctx.delivery.agentAddress, 'poster-approved');

      await this.settlementService.recordBountyOutcome({
        bountyId,
        agentAddress: ctx.delivery.agentAddress,
        posterAddress: body.posterAddress,
        outcome: 'paid',
        brokerDecision: ctx.verifierResult?.passed ? 'pass' : 'fail',
        posterDecision: 'approve',
        platformDecision: null,
        amountUsdt: ctx.amountUsdt,
        templateId: ctx.templateId,
        deliverableKind: ctx.deliverableKind,
        verifierType: ctx.verifierType,
        posterRating: body.rating ?? 5,
        posterComment: body.comment ?? null,
      });

      const paidHash = hashData(JSON.stringify({ bountyId, action: 'paid', at: Date.now() }));
      await this.prisma.indexedEvent.upsert({
        where: { transactionHash_logIndex: { transactionHash: paidHash, logIndex: 0 } },
        update: {},
        create: {
          eventName: 'BountyPaid',
          bountyId,
          blockNumber: 0n,
          transactionHash: paidHash,
          logIndex: 0,
          data: {
            agentAddress: ctx.delivery.agentAddress,
            posterAddress: body.posterAddress,
            amountUsdt: ctx.amountUsdt,
          } as Prisma.InputJsonValue,
        },
      });

      this.logger.log(`Bounty ${bountyId.slice(0, 14)}… approved — agent ${ctx.delivery.agentAddress.slice(0, 12)} paid`);
      return { settled: true, action: 'release', txHash };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Approve failed for ${bountyId}: ${msg}`);
      throw new BadRequestException(`Settlement failed: ${msg}`);
    }
  }

  @Post(':bountyId/reject')
  async reject(
    @Param('bountyId') bountyId: string,
    @Body() body: { posterAddress: string; reason: string },
  ) {
    try {
      const already = await this.isAlreadySettled(bountyId);
      if (already) throw new ConflictException(`Bounty already ${already}`);

      const ctx = await this.getBountyContext(bountyId);
      const brokerAlsoRejected = ctx.verifierResult && !ctx.verifierResult.passed;

      if (brokerAlsoRejected && ctx.delivery) {
        const txHash = await this.settlementService.refund(bountyId, 1, body.reason);

        await this.settlementService.recordBountyOutcome({
          bountyId,
          agentAddress: ctx.delivery.agentAddress,
          posterAddress: body.posterAddress,
          outcome: 'rejected',
          brokerDecision: 'fail',
          posterDecision: 'reject',
          platformDecision: null,
          amountUsdt: ctx.amountUsdt,
          templateId: ctx.templateId,
          deliverableKind: ctx.deliverableKind,
          verifierType: ctx.verifierType,
          posterRating: null,
          posterComment: body.reason,
        });

        const refundHash = hashData(JSON.stringify({ bountyId, action: 'refund', at: Date.now() }));
        await this.prisma.indexedEvent.upsert({
          where: { transactionHash_logIndex: { transactionHash: refundHash, logIndex: 0 } },
          update: {},
          create: {
            eventName: 'BountyRefunded',
            bountyId,
            blockNumber: 0n,
            transactionHash: refundHash,
            logIndex: 0,
            data: { posterAddress: body.posterAddress, reason: body.reason } as Prisma.InputJsonValue,
          },
        });

        this.logger.log(`Bounty ${bountyId.slice(0, 14)}… rejected + refunded (broker agreed)`);
        return { settled: true, action: 'refund', txHash, brokerAgreed: true };
      }

      // Broker passed but poster rejected → dispute
      const reasonHash = hashData(body.reason);
      await this.prisma.dispute.upsert({
        where: { bountyId },
        update: { reason: body.reason, reasonHash },
        create: {
          bountyId,
          posterAddress: body.posterAddress,
          reason: body.reason,
          reasonHash,
        },
      });

      const disputeEvHash = hashData(JSON.stringify({ bountyId, action: 'dispute', at: Date.now() }));
      await this.prisma.indexedEvent.upsert({
        where: { transactionHash_logIndex: { transactionHash: disputeEvHash, logIndex: 0 } },
        update: {},
        create: {
          eventName: 'BountyDisputed',
          bountyId,
          blockNumber: 0n,
          transactionHash: disputeEvHash,
          logIndex: 0,
          data: { posterAddress: body.posterAddress, reason: body.reason } as Prisma.InputJsonValue,
        },
      });

      this.logger.log(`Dispute opened for ${bountyId.slice(0, 14)}…: broker passed, poster rejected`);
      return { settled: false, action: 'dispute-opened', disputeReason: body.reason };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Reject failed for ${bountyId}: ${msg}`);
      throw new BadRequestException(`Rejection failed: ${msg}`);
    }
  }

  @Post(':bountyId/dispute/resolve')
  async resolveDispute(
    @Param('bountyId') bountyId: string,
    @Body() body: { decision: 'agent' | 'poster'; reasoning: string },
  ) {
    try {
      const dispute = await this.prisma.dispute.findUnique({ where: { bountyId } });
      if (!dispute) throw new BadRequestException('No dispute found');

      const ctx = await this.getBountyContext(bountyId);
      const decisionHash = hashData(JSON.stringify({ bountyId, decision: body.decision, reasoning: body.reasoning }));

      await this.prisma.dispute.update({
        where: { bountyId },
        data: {
          resolvedAt: new Date(),
          platformDecision: body.decision,
          platformReasoning: body.reasoning,
          platformDecisionHash: decisionHash,
        },
      });

      let txHash: string | null = null;

      if (body.decision === 'agent' && ctx.delivery) {
        txHash = await this.settlementService.release(bountyId, ctx.delivery.agentAddress, 'platform-sided-agent');

        await this.settlementService.recordBountyOutcome({
          bountyId,
          agentAddress: ctx.delivery.agentAddress,
          posterAddress: dispute.posterAddress,
          outcome: 'disputed-won',
          brokerDecision: ctx.verifierResult?.passed ? 'pass' : 'fail',
          posterDecision: 'dispute',
          platformDecision: 'agent',
          amountUsdt: ctx.amountUsdt,
          templateId: ctx.templateId,
          deliverableKind: ctx.deliverableKind,
          verifierType: ctx.verifierType,
          posterRating: null,
          posterComment: null,
        });
      } else if (body.decision === 'poster') {
        txHash = await this.settlementService.refund(bountyId, 2, 'platform-sided-poster');

        if (ctx.delivery) {
          await this.settlementService.recordBountyOutcome({
            bountyId,
            agentAddress: ctx.delivery.agentAddress,
            posterAddress: dispute.posterAddress,
            outcome: 'disputed-lost',
            brokerDecision: ctx.verifierResult?.passed ? 'pass' : 'fail',
            posterDecision: 'dispute',
            platformDecision: 'poster',
            amountUsdt: ctx.amountUsdt,
            templateId: ctx.templateId,
            deliverableKind: ctx.deliverableKind,
            verifierType: ctx.verifierType,
            posterRating: null,
            posterComment: null,
          });
        }
      }

      this.logger.log(`Dispute resolved for ${bountyId.slice(0, 14)}…: ${body.decision}`);
      return { resolved: true, decision: body.decision, txHash };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Dispute resolve failed for ${bountyId}: ${msg}`);
      throw new BadRequestException(`Dispute resolution failed: ${msg}`);
    }
  }
}
