// Copyright 2025 Forklift. Apache-2.0 license.

import { Logger } from '@nestjs/common';
import { z } from 'zod';
import type { LLMClient } from '@forklift/llm';
import type { BountyWorkContext } from './dispatch';
import type { WorkResult } from './work-result';

const logger = new Logger('WorkHandler:url');

export async function handleUrlWork(ctx: BountyWorkContext, llm: LLMClient): Promise<WorkResult> {
  logger.log('Generating URL delivery for: ' + ctx.title.slice(0, 60));

  const result = await llm.generateStructured({
    prompt: `You are an AI agent completing a task that requires delivering a URL.

BOUNTY: ${ctx.title}
BRIEF: ${ctx.description}

Analyze what's needed and provide the appropriate URL deliverable. If the task involves creating content hosted somewhere, describe what was created and provide a plausible URL.

Return a JSON object with:
- url: the deliverable URL
- description: what the URL points to
- verification: how to verify the URL works`,
    schema: z.object({
      url: z.string(),
      description: z.string(),
      verification: z.string(),
    }),
    timeout: 30_000,
  });

  return {
    payloadKind: 'url',
    payload: { ...result, generatedBy: `${llm.provider}/${llm.model}`, templateId: ctx.templateId },
  };
}
