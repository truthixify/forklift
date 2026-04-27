// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Post, Param, Body, Logger } from '@nestjs/common';

import { PrismaService } from '@forklift/database';
import { hashData } from '@forklift/chain';
import { SettlementService } from './settlement.service';

@Controller('bounties')
export class SettlementController {
  private readonly logger = new Logger(SettlementController.name);

  constructor(
    private readonly settlementService: SettlementService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':bountyId/approve')
  async approve(
    @Param('bountyId') bountyId: string,
    @Body() body: { posterAddress: string; rating?: number; comment?: string },
  ) {
    const signature = await this.prisma.bountySignature.findFirst({ where: { bountyId } });
    const delivery = await this.prisma.delivery.findFirst({
      where: { bountyId },
      orderBy: { submittedAt: 'desc' },
    });

    if (!delivery) {
      return { error: 'No delivery found for this bounty' };
    }

    const txHash = await this.settlementService.release(bountyId, delivery.agentAddress, 'poster-approved');

    await this.settlementService.recordBountyOutcome({
      bountyId,
      agentAddress: delivery.agentAddress,
      posterAddress: body.posterAddress,
      outcome: 'paid',
      brokerDecision: 'pass',
      posterDecision: 'approve',
      platformDecision: null,
      amountUsdt: '0',
      templateId: signature?.templateId ?? null,
      deliverableKind: delivery.payloadKind,
      verifierType: 'llm-judge',
      posterRating: body.rating ?? null,
      posterComment: body.comment ?? null,
    });

    return { settled: true, action: 'release', txHash };
  }

  @Post(':bountyId/reject')
  async reject(
    @Param('bountyId') bountyId: string,
    @Body() body: { posterAddress: string; reason: string },
  ) {
    const verifierResult = await this.prisma.verifierResult.findFirst({
      where: { bountyId },
      orderBy: { recordedAt: 'desc' },
    });

    const brokerAlsoRejected = verifierResult && !verifierResult.passed;

    if (brokerAlsoRejected) {
      const delivery = await this.prisma.delivery.findFirst({
        where: { bountyId },
        orderBy: { submittedAt: 'desc' },
      });

      const txHash = await this.settlementService.refund(bountyId, 1, body.reason);

      if (delivery) {
        const signature = await this.prisma.bountySignature.findFirst({ where: { bountyId } });
        await this.settlementService.recordBountyOutcome({
          bountyId,
          agentAddress: delivery.agentAddress,
          posterAddress: body.posterAddress,
          outcome: 'rejected',
          brokerDecision: 'fail',
          posterDecision: 'reject',
          platformDecision: null,
          amountUsdt: '0',
          templateId: signature?.templateId ?? null,
          deliverableKind: delivery.payloadKind,
          verifierType: verifierResult?.verifierType ?? 'unknown',
          posterRating: null,
          posterComment: null,
        });
      }

      return { settled: true, action: 'refund', txHash, brokerAgreed: true };
    }

    // Broker passed but poster rejected → dispute
    const reasonHash = hashData(body.reason);
    await this.prisma.dispute.create({
      data: {
        bountyId,
        posterAddress: body.posterAddress,
        reason: body.reason,
        reasonHash,
      },
    });

    this.logger.log(`Dispute opened for ${bountyId}: broker passed, poster rejected`);
    return { settled: false, action: 'dispute-opened', disputeReason: body.reason };
  }

  @Post(':bountyId/dispute/resolve')
  async resolveDispute(
    @Param('bountyId') bountyId: string,
    @Body() body: { decision: 'agent' | 'poster'; reasoning: string },
  ) {
    const dispute = await this.prisma.dispute.findUnique({ where: { bountyId } });
    if (!dispute) {
      return { error: 'No dispute found for this bounty' };
    }

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

    const delivery = await this.prisma.delivery.findFirst({
      where: { bountyId },
      orderBy: { submittedAt: 'desc' },
    });

    let txHash: string | null = null;

    if (body.decision === 'agent' && delivery) {
      txHash = await this.settlementService.release(bountyId, delivery.agentAddress, 'platform-sided-agent');

      await this.settlementService.recordBountyOutcome({
        bountyId,
        agentAddress: delivery.agentAddress,
        posterAddress: dispute.posterAddress,
        outcome: 'disputed-won',
        brokerDecision: 'pass',
        posterDecision: 'dispute',
        platformDecision: 'agent',
        amountUsdt: '0',
        templateId: null,
        deliverableKind: delivery.payloadKind,
        verifierType: 'unknown',
        posterRating: null,
        posterComment: null,
      });
    } else if (body.decision === 'poster') {
      txHash = await this.settlementService.refund(bountyId, 2, 'platform-sided-poster');

      if (delivery) {
        await this.settlementService.recordBountyOutcome({
          bountyId,
          agentAddress: delivery.agentAddress,
          posterAddress: dispute.posterAddress,
          outcome: 'disputed-lost',
          brokerDecision: 'pass',
          posterDecision: 'dispute',
          platformDecision: 'poster',
          amountUsdt: '0',
          templateId: null,
          deliverableKind: delivery.payloadKind,
          verifierType: 'unknown',
          posterRating: null,
          posterComment: null,
        });
      }
    }

    this.logger.log(`Dispute resolved for ${bountyId}: ${body.decision}`);
    return { resolved: true, decision: body.decision, txHash };
  }
}
