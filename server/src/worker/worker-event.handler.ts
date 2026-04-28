// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import type { Prisma } from '@prisma/client';
import { PrismaService } from '@forklift/database';
import { SubgraphClient, type SubgraphBountyCreated } from '@forklift/chain';
import { LLMProviderFactory } from '@forklift/llm';
import { DeliveryService } from '@forklift/delivery';
import { hashData } from '@forklift/chain';
import { NotificationService } from '@forklift/notifications';
import { VerifierRegistry } from '@forklift/verifiers';
import { ClaimService } from './claim.service';
import { dispatchWork } from './handlers/dispatch';
import type { WorkerProfile } from './worker-profile';

@Injectable()
export class WorkerEventHandler implements OnModuleInit {
  private readonly logger = new Logger(WorkerEventHandler.name);
  private lastCheckedTimestamp = 0;
  private readonly processedBounties = new Set<string>();
  private readonly processedAssignments = new Set<string>();

  constructor(
    private readonly claimService: ClaimService,
    private readonly prisma: PrismaService,
    private readonly subgraph: SubgraphClient,
    private readonly llmFactory: LLMProviderFactory,
    private readonly deliveryService: DeliveryService,
    private readonly notifications: NotificationService,
    private readonly verifierRegistry: VerifierRegistry,
  ) {}

  async onModuleInit() {
    const latest = await this.prisma.indexedEvent.findFirst({
      where: { eventName: 'BountyCreated' },
      orderBy: { blockNumber: 'desc' },
      select: { indexedAt: true },
    });

    if (latest) {
      this.lastCheckedTimestamp = Math.floor(latest.indexedAt.getTime() / 1000);
    } else {
      this.lastCheckedTimestamp = Math.floor(Date.now() / 1000) - 3600;
    }

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

  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollForAssignments() {
    const assignedEvents = await this.prisma.indexedEvent.findMany({
      where: { eventName: 'BountyAssigned' },
    });

    for (const event of assignedEvents) {
      const bountyId = event.bountyId;
      if (!bountyId) continue;
      if (this.processedAssignments.has(bountyId)) continue;

      const existingDelivery = await this.prisma.delivery.findFirst({
        where: { bountyId },
      });
      if (existingDelivery) {
        this.processedAssignments.add(bountyId);
        continue;
      }

      const data = event.data as Record<string, unknown>;
      const assignedAgent = (data['assignedAgent'] as string) ?? '';
      if (!assignedAgent) continue;

      this.processedAssignments.add(bountyId);
      await this.handleAssignment(bountyId, assignedAgent);
    }
  }

  private async getActiveAgentProfiles(): Promise<WorkerProfile[]> {
    const agents = await this.prisma.workerAgent.findMany({
      where: { status: 'active' },
    });

    return agents.map((a) => {
      const config = (a.profileConfig as Record<string, unknown>) ?? {};
      const spec = (config.specialization as Record<string, unknown>) ?? {};
      const aiConfig = (a.aiProviderConfig as Record<string, unknown>) ?? {};
      const caps = (config.spendCaps as Record<string, string>) ?? {};

      return {
        name: a.name,
        displayName: a.displayName || a.name,
        passportAddress: a.passportAddress,
        specialization: {
          templates: (spec.templates as string[]) ?? [],
          deliverableKinds: (spec.deliverableKinds as string[]) ?? [],
          willStretch: (spec.willStretch as boolean) ?? true,
          claimThreshold: (spec.claimThreshold as number) ?? 0.5,
          minBountyUSDT: (spec.minBountyUSDT as string) ?? '1000000000000000000',
          maxBountyUSDT: (spec.maxBountyUSDT as string) ?? '100000000000000000000',
        },
        etaModel: { trivial: 120, small: 300, medium: 900, large: 1800 },
        aiProvider: {
          provider: (aiConfig.provider as string) ?? 'gemini',
          model: (aiConfig.model as string) ?? 'gemini-2.5-flash',
        },
        spendCaps: {
          perTaskUSDT: caps.perTaskUSDT ?? '2500000000000000000',
          globalDailyUSDT: caps.globalDailyUSDT ?? '50000000000000000000',
        },
      };
    });
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

    const profiles = await this.getActiveAgentProfiles();

    if (profiles.length === 0) {
      this.logger.warn(`No active agents to evaluate bounty ${event.bountyId}`);
      return;
    }

    let claimCount = 0;
    for (const profile of profiles) {
      const existingClaim = await this.prisma.proposal.findFirst({
        where: { bountyId: event.bountyId, agentAddress: profile.passportAddress },
      });
      if (existingClaim) continue;

      if (this.claimService.shouldClaim(profile, bountyInfo)) {
        this.logger.log(`${profile.displayName} claiming bounty ${event.bountyId}`);
        try {
          const proposal = await this.claimService.generateProposal(profile, bountyInfo);
          claimCount++;
          this.logger.log(
            `${profile.displayName} proposed: "${proposal.proposalText.slice(0, 80)}..." (ETA: ${proposal.etaMinutes}m)`,
          );
        } catch (error) {
          this.logger.error(`${profile.displayName} failed to claim ${event.bountyId}`, error);
        }
      }
    }

    this.logger.log(`Bounty ${event.bountyId}: ${claimCount} agent(s) claimed out of ${profiles.length} active`);
  }

  private async handleAssignment(bountyId: string, agentAddress: string) {
    this.logger.log(`Processing assignment: ${agentAddress} assigned to ${bountyId}`);

    const signature = await this.prisma.bountySignature.findFirst({
      where: { bountyId },
    });

    const title = signature?.title ?? 'Unknown bounty';
    const description = signature?.description ?? '';
    const deliverableKind = this.extractDeliverableKind(signature?.deliverableSchema);

    const agent = await this.prisma.workerAgent.findUnique({
      where: { passportAddress: agentAddress },
    });

    const aiConfig = (agent?.aiProviderConfig as Record<string, unknown>) ?? {};
    const llm = this.llmFactory.create({
      provider: (aiConfig.provider as string as 'gemini' | 'anthropic' | 'openai' | 'openrouter') ?? 'gemini',
      model: (aiConfig.model as string) ?? 'gemini-2.5-flash',
    });

    try {
      this.logger.log(`Agent ${agentAddress} starting work on ${bountyId} (kind: ${deliverableKind})`);
      const workResult = await dispatchWork(deliverableKind, title, description, llm);

      const delivery = await this.deliveryService.storeDelivery({
        bountyId,
        agentAddress,
        payloadKind: workResult.payloadKind,
        payload: workResult.payload,
        attemptNumber: 1,
      });

      this.logger.log(`Delivery stored for ${bountyId}: ${delivery.hash}`);

      await this.runVerification(bountyId, agentAddress, delivery.hash, title, description, signature, workResult);
    } catch (error) {
      this.logger.error(`Work execution failed for ${bountyId} by ${agentAddress}`, error);
    }
  }

  private async runVerification(
    bountyId: string,
    agentAddress: string,
    deliveryHash: string,
    title: string,
    description: string,
    signature: { deliverableSchema: unknown; verifierConfig: unknown } | null,
    workResult: { payloadKind: string; payload: Record<string, unknown> },
  ) {
    const verConfig = (signature?.verifierConfig as Record<string, unknown>) ?? {};
    const verType = (verConfig.type as string) ?? 'llm-judge';
    const verConf = (verConfig.config as Record<string, unknown>) ?? {};

    const delivSchema = (signature?.deliverableSchema as Record<string, unknown>) ?? {};

    const result = await this.verifierRegistry.verify({
      delivery: {
        hash: deliveryHash,
        bountyId,
        agentAddress,
        payloadKind: workResult.payloadKind,
        payload: workResult.payload,
        attemptNumber: 1,
      },
      bounty: {
        bountyId,
        title,
        description,
        deliverableSchema: delivSchema,
        verifierConfig: { type: verType, config: verConf },
      },
      config: verConf,
    });

    const resultHash = hashData(JSON.stringify({ bountyId, agentAddress, deliveryHash, result }));

    const llm = this.llmFactory.create();

    await this.prisma.verifierResult.create({
      data: {
        hash: resultHash,
        bountyId,
        agentAddress,
        deliveryHash,
        verifierType: verType,
        passed: result.passed,
        score: result.score ?? null,
        reasoning: result.reasoning,
        evidence: result.evidence as Prisma.InputJsonValue,
        brokerProvider: llm.provider,
        brokerModel: llm.model,
      },
    });

    this.logger.log(`Verification for ${bountyId}: ${result.passed ? 'PASSED' : 'FAILED'} (score: ${result.score?.toFixed(2) ?? 'n/a'})`);

    const posterEvent = await this.prisma.indexedEvent.findFirst({
      where: { bountyId, eventName: 'BountyCreated' },
    });
    const posterAddress = posterEvent ? (posterEvent.data as Record<string, unknown>)['poster'] as string : null;

    if (posterAddress) {
      await this.notifications.notify({
        userAddress: posterAddress,
        category: 'bounty.delivered',
        title: 'Delivery submitted',
        body: `An agent delivered on "${title.slice(0, 40)}" — ${result.passed ? 'verifier passed' : 'verifier flagged issues'}. Review now.`,
        payload: { bountyId, agentAddress, passed: result.passed, score: result.score },
        ctaLabel: 'Review delivery',
        ctaHref: `/dashboard/poster/bounties/${bountyId}`,
      });
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
