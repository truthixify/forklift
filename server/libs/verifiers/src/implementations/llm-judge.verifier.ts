// Copyright 2025 Forklift. Apache-2.0 license.

import { z } from 'zod';

import type { Verifier, VerifierArgs, VerifierResult } from '../verifier.interface';
import type { LLMClient } from '@forklift/llm';

const JudgeOutputSchema = z.object({
  score: z.number().min(0).max(1),
  reasoning: z.string(),
});

export class LLMJudgeVerifier implements Verifier {
  readonly type = 'llm-judge';

  constructor(private readonly llm: LLMClient) {}

  async verify(args: VerifierArgs): Promise<VerifierResult> {
    const { delivery, bounty, config } = args;

    const rubric = (config['rubric'] as string) ?? 'Evaluate the delivery quality.';
    const passThreshold = (config['passThreshold'] as number) ?? 0.6;

    const prompt = `You are a delivery verifier. Score this delivery on a 0–1 scale.

BOUNTY:
Title: ${bounty.title}
Description: ${bounty.description}

DELIVERY (${delivery.payloadKind}):
${JSON.stringify(delivery.payload, null, 2).slice(0, 3000)}

RUBRIC:
${rubric}

Return JSON: { "score": <0.0-1.0>, "reasoning": "<explanation>" }`;

    try {
      const result = await this.llm.generateStructured({
        prompt,
        schema: JudgeOutputSchema,
        timeout: 15_000,
      });

      return {
        passed: result.score >= passThreshold,
        score: result.score,
        reasoning: result.reasoning,
        evidence: {
          rubric,
          passThreshold,
          llmScore: result.score,
          provider: this.llm.provider,
          model: this.llm.model,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        passed: false,
        score: 0,
        reasoning: `LLM judge failed: ${message}`,
        evidence: { error: message, rubric, passThreshold },
      };
    }
  }
}
