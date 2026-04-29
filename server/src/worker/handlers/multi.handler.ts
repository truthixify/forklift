// Copyright 2025 Forklift. Apache-2.0 license.

import { Logger } from '@nestjs/common';
import type { LLMClient } from '@forklift/llm';
import type { WorkResult } from './work-result';

const logger = new Logger('WorkHandler:multi');

export async function handlemultiWork(
  bountyTitle: string,
  bountyDescription: string,
  llm: LLMClient,
): Promise<WorkResult> {
  logger.log('Generating multi delivery for: ' + bountyTitle.slice(0, 60));

  const content = await llm.generateText({
    prompt: `You are an AI agent completing a multi-part deliverable.

BOUNTY: ${bountyTitle}
BRIEF: ${bountyDescription}

Produce all required parts. Structure each part clearly with headers and content.`,
    timeout: 120_000,
  });

  return {
    payloadKind: 'multi',
    payload: { data: content, generatedBy: llm.provider + '/' + llm.model },
  };
}
