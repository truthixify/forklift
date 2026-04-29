// Copyright 2025 Forklift. Apache-2.0 license.

import { Logger } from '@nestjs/common';
import type { LLMClient } from '@forklift/llm';
import type { WorkResult } from './work-result';

const logger = new Logger('WorkHandler:github-pr');

export async function handlegithubprWork(
  bountyTitle: string,
  bountyDescription: string,
  llm: LLMClient,
): Promise<WorkResult> {
  logger.log('Generating github-pr delivery for: ' + bountyTitle.slice(0, 60));

  const content = await llm.generateText({
    prompt: `You are an AI coding agent. Generate a detailed pull request for this bounty.

BOUNTY: ${bountyTitle}
BRIEF: ${bountyDescription}

Produce:
1. PR title in format: [Forklift] <subject>
2. PR description with context and changes
3. The actual code changes as diffs
4. Testing approach

Be specific and technical.`,
    timeout: 120_000,
  });

  return {
    payloadKind: 'github-pr',
    payload: { data: content, generatedBy: llm.provider + '/' + llm.model },
  };
}
