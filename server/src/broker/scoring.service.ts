// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@forklift/database';
import { LLMProviderFactory } from '@forklift/llm';
import {
  computeRelevance,
  computeReliability,
  computeFreshness,
  computeProbationMultiplier,
  SCORING_CONFIG,
} from '@forklift/scoring';
import { buildProposalJudgePrompt } from '@forklift/llm';
import { z } from 'zod';

interface ClaimCandidate {
  agentAddress: string;
  proposalText: string;
  assertedDimensions: number[];
  etaMinutes: number | null;
}

interface AgentStats {
  paid: number;
  rejected: number;
  ghosted: number;
  withdrawn: number;
  disputesLost: number;
  lastActiveAt: Date | null;
}

export interface ScoredCandidate {
  agentAddress: string;
  components: {
    relevance: number;
    reliability: number;
    proposalQuality: number;
    freshness: number;
  };
  probationMultiplier: number;
  raw: number;
  adjusted: number;
  rank: number;
  reasoning: string;
}

const JudgeResultSchema = z.object({
  score: z.number().min(0).max(100),
  breakdown: z.object({
    specificity: z.number(),
    credibility: z.number(),
    etaRealism: z.number(),
    edgeCases: z.number(),
    honesty: z.number(),
  }),
  reasoning: z.string(),
});

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmFactory: LLMProviderFactory,
  ) {}

  async scoreClaims(
    _bountyId: string,
    bountyTitle: string,
    bountyDescription: string,
    templateId: string | null,
    deliverableKind: string,
    candidates: ClaimCandidate[],
  ): Promise<ScoredCandidate[]> {
    const scored: ScoredCandidate[] = [];

    for (const candidate of candidates) {
      const stats = await this.getAgentStats(candidate.agentAddress);

      const relevance = computeRelevance(stats, templateId, deliverableKind);
      const reliability = computeReliability(stats);
      const freshness = computeFreshness(stats.lastActiveAt);
      const probation = computeProbationMultiplier(stats.paid);

      let proposalQuality: number;
      try {
        proposalQuality = await this.judgeProposal(
          bountyTitle,
          bountyDescription,
          candidate.proposalText,
          this.formatTrackRecord(stats),
        );
      } catch (error) {
        this.logger.warn(`Proposal judge failed for ${candidate.agentAddress}, using fallback`, error);
        proposalQuality = SCORING_CONFIG.judgeFailureFallback;
      }

      const raw =
        SCORING_CONFIG.weights.relevance * relevance +
        SCORING_CONFIG.weights.reliability * reliability +
        SCORING_CONFIG.weights.proposalQuality * proposalQuality +
        SCORING_CONFIG.weights.freshness * freshness;

      const adjusted = raw * probation;

      scored.push({
        agentAddress: candidate.agentAddress,
        components: { relevance, reliability, proposalQuality, freshness },
        probationMultiplier: probation,
        raw,
        adjusted,
        rank: 0,
        reasoning: `relevance=${relevance.toFixed(2)} reliability=${reliability.toFixed(2)} proposal=${proposalQuality.toFixed(2)} freshness=${freshness.toFixed(2)} probation=${probation}`,
      });
    }

    scored.sort((a, b) => b.adjusted - a.adjusted);
    scored.forEach((s, i) => {
      s.rank = i + 1;
    });

    return scored;
  }

  private async getAgentStats(agentAddress: string): Promise<AgentStats> {
    const records = await this.prisma.bountyRecord.findMany({
      where: { party: agentAddress, side: 'agent' },
    });

    const stats: AgentStats = {
      paid: 0,
      rejected: 0,
      ghosted: 0,
      withdrawn: 0,
      disputesLost: 0,
      lastActiveAt: null,
    };

    for (const r of records) {
      switch (r.outcome) {
        case 'paid':
          stats.paid++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
        case 'ghosted':
          stats.ghosted++;
          break;
        case 'withdrawn':
          stats.withdrawn++;
          break;
        case 'disputed-lost':
          stats.disputesLost++;
          break;
      }
      if (!stats.lastActiveAt || r.occurredAt > stats.lastActiveAt) {
        stats.lastActiveAt = r.occurredAt;
      }
    }

    return stats;
  }

  private async judgeProposal(
    bountyTitle: string,
    bountyDescription: string,
    proposalText: string,
    trackRecord: string,
  ): Promise<number> {
    const llm = this.llmFactory.create();
    const prompt = buildProposalJudgePrompt(bountyTitle, bountyDescription, proposalText, trackRecord);

    const result = await llm.generateStructured({
      prompt,
      schema: JudgeResultSchema,
      timeout: SCORING_CONFIG.judgeTimeout,
    });

    return result.score / 100;
  }

  private formatTrackRecord(stats: AgentStats): string {
    return `Paid: ${stats.paid}, Rejected: ${stats.rejected}, Ghosted: ${stats.ghosted}, Withdrawn: ${stats.withdrawn}, Disputes lost: ${stats.disputesLost}`;
  }
}
