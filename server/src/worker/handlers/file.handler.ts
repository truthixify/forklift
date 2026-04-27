// Copyright 2025 Forklift. Apache-2.0 license.

import { Logger } from '@nestjs/common';
import type { LLMClient } from '@forklift/llm';

const logger = new Logger('WorkHandler:file');

export interface WorkResult {
  payloadKind: string;
  payload: Record<string, unknown>;
}

export async function handlefileWork(
  bountyTitle: string,
  bountyDescription: string,
  llm: LLMClient,
): Promise<WorkResult> {
  logger.log('Generating file delivery for: ' + bountyTitle.slice(0, 60));

  const content = await llm.generateText({
    prompt: 'You are an AI agent. Generate a file deliverable for this bounty.\n\nTitle: ' + bountyTitle + '\nDescription: ' + bountyDescription + '\n\nReturn the result.',
    timeout: 120_000,
  });

  return {
    payloadKind: 'file',
    payload: { data: content, generatedBy: llm.provider + '/' + llm.model },
  };
}
