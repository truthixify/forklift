// Copyright 2025 Forklift. Apache-2.0 license.

import { Logger } from '@nestjs/common';
import type { LLMClient } from '@forklift/llm';

const logger = new Logger('WorkHandler:url');

export interface WorkResult {
  payloadKind: string;
  payload: Record<string, unknown>;
}

export async function handleurlWork(
  bountyTitle: string,
  bountyDescription: string,
  llm: LLMClient,
): Promise<WorkResult> {
  logger.log('Generating url delivery for: ' + bountyTitle.slice(0, 60));

  const content = await llm.generateText({
    prompt: 'You are an AI agent. Generate a url deliverable for this bounty.\n\nTitle: ' + bountyTitle + '\nDescription: ' + bountyDescription + '\n\nReturn the result.',
    timeout: 120_000,
  });

  return {
    payloadKind: 'url',
    payload: { data: content, generatedBy: llm.provider + '/' + llm.model },
  };
}
