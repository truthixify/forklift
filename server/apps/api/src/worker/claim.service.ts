// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';

import { PrismaService } from '@forklift/database';
import { LLMProviderFactory } from '@forklift/llm';
import { buildProposalGenPrompt } from '@forklift/llm';
import { hashData } from '@forklift/chain';
import type { WorkerProfile } from './worker-profile';

interface BountyInfo {
  bountyId: string;
  title: string;
  description: string;
  templateId: string | null;
  deliverableKind: string;
  amount: string;
}

const ProposalSchema = z.object({
  proposalText: z.string().min(1),
  etaMinutes: z.number().positive(),
});

@Injectable()
export class ClaimService {
  private readonly logger = new Logger(ClaimService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmFactory: LLMProviderFactory,
  ) {}

  shouldClaim(profile: WorkerProfile, bounty: BountyInfo): boolean {
    const { specialization } = profile;

    if (bounty.templateId && specialization.templates.length > 0) {
      if (!specialization.templates.includes(bounty.templateId) && !specialization.willStretch) {
        return false;
      }
    }

    if (
      specialization.deliverableKinds.length > 0 &&
      !specialization.deliverableKinds.includes(bounty.deliverableKind)
    ) {
      if (!specialization.willStretch) return false;
    }

    if (BigInt(bounty.amount) < BigInt(specialization.minBountyUSDT)) return false;
    if (BigInt(bounty.amount) > BigInt(specialization.maxBountyUSDT)) return false;

    return true;
  }

  async generateProposal(
    profile: WorkerProfile,
    bounty: BountyInfo,
  ): Promise<{ proposalText: string; etaMinutes: number; proposalHash: string }> {
    const llm = this.llmFactory.create({
      provider: profile.aiProvider.provider as 'gemini' | 'anthropic' | 'openai' | 'openrouter',
      model: profile.aiProvider.model,
    });

    const eta = this.estimateEta(profile, bounty);
    const prompt = buildProposalGenPrompt(
      bounty.title,
      bounty.description,
      profile.displayName,
      profile.specialization.templates.join(', ') || profile.specialization.deliverableKinds.join(', '),
      eta,
    );

    let result: z.infer<typeof ProposalSchema>;
    try {
      result = await llm.generateStructured({
        prompt,
        schema: ProposalSchema,
        timeout: 10_000,
      });
    } catch (error) {
      this.logger.warn(`Proposal gen failed for ${profile.name}, using fallback`, error);
      result = {
        proposalText: `I can handle this ${bounty.templateId ?? 'task'} efficiently with my experience.`,
        etaMinutes: eta,
      };
    }

    const proposalHash = hashData(
      JSON.stringify({ agent: profile.passportAddress, bountyId: bounty.bountyId, text: result.proposalText }),
    );

    await this.prisma.proposal.create({
      data: {
        hash: proposalHash,
        bountyId: bounty.bountyId,
        agentAddress: profile.passportAddress,
        proposalText: result.proposalText,
        assertedDimensions: [],
        etaMinutes: result.etaMinutes,
        generatedByProvider: profile.aiProvider.provider,
        generatedByModel: profile.aiProvider.model,
      },
    });

    return {
      proposalText: result.proposalText,
      etaMinutes: result.etaMinutes,
      proposalHash,
    };
  }

  private estimateEta(profile: WorkerProfile, bounty: BountyInfo): number {
    const amount = Number(BigInt(bounty.amount) / BigInt(10 ** 18));
    if (amount <= 5) return profile.etaModel.trivial;
    if (amount <= 15) return profile.etaModel.small;
    if (amount <= 50) return profile.etaModel.medium;
    return profile.etaModel.large;
  }
}
