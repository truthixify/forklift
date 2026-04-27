// Copyright 2025 Forklift. Apache-2.0 license.

import type { LLMClient } from '@forklift/llm';
import type { WorkResult } from './url.handler';
import { handleurlWork } from './url.handler';
import { handlefileWork } from './file.handler';
import { handlejsonWork } from './json.handler';
import { handlegithubprWork } from './github-pr.handler';
import { handlemultiWork } from './multi.handler';

const handlers: Record<string, (title: string, desc: string, llm: LLMClient) => Promise<WorkResult>> = {
  url: handleurlWork,
  file: handlefileWork,
  json: handlejsonWork,
  'github-pr': handlegithubprWork,
  multi: handlemultiWork,
};

export async function dispatchWork(
  kind: string,
  bountyTitle: string,
  bountyDescription: string,
  llm: LLMClient,
): Promise<WorkResult> {
  const handler = handlers[kind] ?? handlers['json']!;
  return handler(bountyTitle, bountyDescription, llm);
}
