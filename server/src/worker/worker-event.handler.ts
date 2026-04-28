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
    this.lastCheckedTimestamp = Math.floor(Date.now() / 1000) - 3600;

    const assigned = await this.prisma.indexedEvent.count({ where: { eventName: 'BountyAssigned' } });
    const delivered = await this.prisma.delivery.count();
    const pending = assigned - delivered;
    this.logger.log(`Worker started — ${assigned} assigned, ${delivered} delivered, ${pending} pending work`);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollForNewBounties() {
    const bounties = await this.subgraph.getRecentBountyCreateds(this.lastCheckedTimestamp);

    for (const bounty of bounties) {
      const ts = Number(bounty.timestamp_);
      if (ts > this.lastCheckedTimestamp) {
        this.lastCheckedTimestamp = ts;
      }

      const alreadyIndexed = await this.prisma.indexedEvent.findFirst({
        where: { bountyId: bounty.bountyId, eventName: 'BountyCreated' },
      });

      if (alreadyIndexed) {
        await this.claimIfNeeded(bounty.bountyId, bounty);
        continue;
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

      // Already delivered — done
      const existingDelivery = await this.prisma.delivery.findFirst({
        where: { bountyId },
      });
      if (existingDelivery) continue;

      const data = event.data as Record<string, unknown>;
      const assignedAgent = (data['assignedAgent'] as string) ?? '';
      if (!assignedAgent) continue;

      // Check work runs — only skip if currently running
      const workRun = await this.prisma.workRun.findFirst({
        where: { bountyId },
        orderBy: { startedAt: 'desc' },
      });

      if (workRun) {
        if (workRun.status === 'running') {
          // Stale running work from a crashed server — reset after 5 min
          const staleAfter = new Date(Date.now() - 5 * 60 * 1000);
          if (workRun.startedAt > staleAfter) continue;
          this.logger.warn(`Resetting stale work run for ${bountyId}`);
          await this.prisma.workRun.delete({ where: { id: workRun.id } });
        } else if (workRun.status === 'delivered') {
          continue;
        }
        // status === 'failed' → allow retry by falling through
      }

      this.logger.log(`Starting work on assigned bounty ${bountyId} → agent ${assignedAgent.slice(0, 12)}`);

      await this.prisma.workRun.create({
        data: {
          bountyId,
          agentAddress: assignedAgent,
          startedAt: new Date(),
          status: 'running',
          log: [],
        },
      });

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
          minBountyUSDT: (spec.minBountyUSDT as string) ?? '100000000000000',
          maxBountyUSDT: (spec.maxBountyUSDT as string) ?? '100000000000000000000',
        },
        etaModel: { trivial: 120, small: 300, medium: 900, large: 1800 },
        aiProvider: {
          provider: ((aiConfig.provider as string) === 'forklift' ? 'gemini' : (aiConfig.provider as string)) ?? 'gemini',
          model: (aiConfig.model as string) ?? 'gemini-2.5-flash',
        },
        spendCaps: {
          perTaskUSDT: caps.perTaskUSDT ?? '2500000000000000000',
          globalDailyUSDT: caps.globalDailyUSDT ?? '50000000000000000000',
        },
      };
    });
  }

  private async claimIfNeeded(bountyId: string, event?: SubgraphBountyCreated) {
    const assigned = await this.prisma.indexedEvent.findFirst({
      where: { bountyId, eventName: { in: ['BountyAssigned', 'BountyPaid', 'BountyRefunded'] } },
    });
    if (assigned) return;

    const profiles = await this.getActiveAgentProfiles();
    if (profiles.length === 0) return;

    const signature = await this.prisma.bountySignature.findFirst({
      where: { bountyId },
    });

    let amount = event?.amountUSDT ?? '0';
    if (amount === '0') {
      const createdEv = await this.prisma.indexedEvent.findFirst({ where: { bountyId, eventName: 'BountyCreated' } });
      const evData = createdEv?.data as Record<string, unknown> | undefined;
      amount = (evData?.amountUSDT as string) ?? '0';
    }

    const bountyInfo = {
      bountyId,
      title: signature?.title ?? 'Unknown bounty',
      description: signature?.description ?? '',
      templateId: signature?.templateId ?? null,
      deliverableKind: this.extractDeliverableKind(signature?.deliverableSchema),
      amount: typeof amount === 'string' ? amount : '0',
    };

    for (const profile of profiles) {
      const existing = await this.prisma.proposal.findFirst({
        where: { bountyId, agentAddress: profile.passportAddress },
      });
      if (existing) continue;

      if (this.claimService.shouldClaim(profile, bountyInfo)) {
        try {
          await this.claimService.generateProposal(profile, bountyInfo);
          this.logger.log(`${profile.displayName} claimed ${bountyId}`);
        } catch (error) {
          this.logger.error(`${profile.displayName} failed to claim ${bountyId}`, error);
        }
      }
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
          await this.claimService.generateProposal(profile, bountyInfo);
          claimCount++;
        } catch (error) {
          this.logger.error(`${profile.displayName} failed to claim ${event.bountyId}`, error);
        }
      }
    }

    if (claimCount > 0) {
      this.logger.log(`Bounty ${event.bountyId}: ${claimCount} agent(s) claimed`);
    }
  }

  private async handleAssignment(bountyId: string, agentAddress: string) {
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
      provider: ((aiConfig.provider as string) === 'forklift' ? 'gemini' : (aiConfig.provider as string) as 'gemini' | 'anthropic' | 'openai' | 'openrouter') ?? 'gemini',
      model: (aiConfig.model as string) ?? 'gemini-2.5-flash',
    });

    try {
      this.logger.log(`Agent ${agentAddress.slice(0, 12)} working on ${bountyId.slice(0, 14)}… (${deliverableKind})`);
      const workResult = await dispatchWork(deliverableKind, title, description, llm);

      const delivery = await this.deliveryService.storeDelivery({
        bountyId,
        agentAddress,
        payloadKind: workResult.payloadKind,
        payload: workResult.payload,
        attemptNumber: 1,
      });

      this.logger.log(`Delivery stored: ${bountyId.slice(0, 14)}… → ${delivery.hash.slice(0, 14)}…`);

      await this.prisma.workRun.updateMany({
        where: { bountyId, agentAddress },
        data: { status: 'delivered', finishedAt: new Date() },
      });

      await this.runVerification(bountyId, agentAddress, delivery.hash, title, description, signature, workResult);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Work failed for ${bountyId.slice(0, 14)}…: ${msg}`);
      await this.prisma.workRun.updateMany({
        where: { bountyId, agentAddress },
        data: { status: 'failed', finishedAt: new Date() },
      });
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
        hash: deliveryHash, bountyId, agentAddress,
        payloadKind: workResult.payloadKind, payload: workResult.payload, attemptNumber: 1,
      },
      bounty: {
        bountyId, title, description, deliverableSchema: delivSchema,
        verifierConfig: { type: verType, config: verConf },
      },
      config: verConf,
    });

    const resultHash = hashData(JSON.stringify({ bountyId, agentAddress, deliveryHash, result }));
    const llm = this.llmFactory.create();

    await this.prisma.verifierResult.create({
      data: {
        hash: resultHash, bountyId, agentAddress, deliveryHash,
        verifierType: verType, passed: result.passed,
        score: result.score ?? null, reasoning: result.reasoning,
        evidence: result.evidence as Prisma.InputJsonValue,
        brokerProvider: llm.provider, brokerModel: llm.model,
      },
    });

    this.logger.log(`Verified ${bountyId.slice(0, 14)}…: ${result.passed ? 'PASS' : 'FAIL'} (${result.score?.toFixed(2) ?? 'n/a'})`);

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
