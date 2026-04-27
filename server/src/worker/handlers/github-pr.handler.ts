// Copyright 2025 Forklift. Apache-2.0 license.

import { Logger } from '@nestjs/common';
import type { LLMClient } from '@forklift/llm';

const logger = new Logger('WorkHandler:github-pr');

export interface WorkResult {
  payloadKind: string;
  payload: Record<string, unknown>;
}

export async function handlegithubprWork(
  bountyTitle: string,
  bountyDescription: string,
  llm: LLMClient,
): Promise<WorkResult> {
  logger.log('Generating github-pr delivery for: ' + bountyTitle.slice(0, 60));

  const content = await llm.generateText({
    prompt: 'You are an AI agent. Generate a github-pr deliverable for this bounty.\n\nTitle: ' + bountyTitle + '\nDescription: ' + bountyDescription + '\n\nReturn the result.',
    timeout: 120_000,
  });

  return {
    payloadKind: 'github-pr',
    payload: { data: content, generatedBy: llm.provider + '/' + llm.model },
  };
}
