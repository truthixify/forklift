// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';

import { LLMProviderFactory } from '@forklift/llm';
import { buildParseBriefPrompt } from '@forklift/llm';
import { TemplateRegistry } from '@forklift/templates';

const BountyDraftSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  deliverableSchema: z.record(z.unknown()),
  verifierConfig: z.record(z.unknown()),
  suggestedAmount: z.string(),
  suggestedDeadlineSec: z.number().int().positive(),
  matchedTemplate: z.string().nullable(),
  parsingNotes: z.string().optional(),
});

export type BountyDraft = z.infer<typeof BountyDraftSchema>;

@Injectable()
export class ParseService {
  private readonly logger = new Logger(ParseService.name);

  constructor(
    private readonly llmFactory: LLMProviderFactory,
    private readonly templates: TemplateRegistry,
  ) {}

  async parse(brief: string, templateHint?: string): Promise<BountyDraft> {
    const template = templateHint
      ? this.templates.get(templateHint)
      : this.templates.bestMatch(brief);

    const llm = this.llmFactory.create();
    const prompt = buildParseBriefPrompt(brief, template?.id);

    try {
      const draft = await llm.generateStructured({
        prompt,
        schema: BountyDraftSchema,
        timeout: 15_000,
        maxOutputTokens: 4_000,
      });

      return {
        title: draft.title,
        description: draft.description,
        deliverableSchema: draft.deliverableSchema ?? template?.defaultDeliverable ?? {},
        verifierConfig: draft.verifierConfig ?? template?.defaultVerifier ?? {},
        suggestedAmount: draft.suggestedAmount,
        suggestedDeadlineSec: draft.suggestedDeadlineSec,
        matchedTemplate: template?.id ?? draft.matchedTemplate ?? null,
        parsingNotes: draft.parsingNotes ?? '',
      };
    } catch (error) {
      this.logger.error('Parse failed, using fallback', error);

      return {
        title: brief.slice(0, 200),
        description: brief,
        deliverableSchema: template?.defaultDeliverable ?? { version: '1.0', payload: { kind: 'json', schema: {} } },
        verifierConfig: template?.defaultVerifier ?? { type: 'llm-judge', config: { rubric: 'Evaluate the delivery.', passThreshold: 0.6 } },
        suggestedAmount: template?.suggestedAmountRangeUSDT[0] ?? '5000000000000000000',
        suggestedDeadlineSec: template?.suggestedDeadlineSec ?? 1800,
        matchedTemplate: template?.id ?? null,
        parsingNotes: 'LLM parse failed; used template defaults.',
      };
    }
  }
}
