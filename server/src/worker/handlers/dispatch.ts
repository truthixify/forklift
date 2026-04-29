// Copyright 2025 Forklift. Apache-2.0 license.

import type { LLMClient } from '@forklift/llm';
import type { WorkResult } from './work-result';
import { handleJsonWork } from './json.handler';
import { handleFileWork } from './file.handler';
import { handleUrlWork } from './url.handler';
import { handlegithubprWork } from './github-pr.handler';
import { handlemultiWork } from './multi.handler';

export interface BountyWorkContext {
  bountyId: string;
  title: string;
  description: string;
  templateId: string | null;
  deliverableKind: string;
  deliverableSchema: Record<string, unknown> | null;
  verifierConfig: Record<string, unknown> | null;
}

const handlers: Record<string, (ctx: BountyWorkContext, llm: LLMClient) => Promise<WorkResult>> = {
  json: handleJsonWork,
  file: handleFileWork,
  url: handleUrlWork,
};

// Legacy handlers for github-pr and multi (still use old signature)
const legacyHandlers: Record<string, (title: string, desc: string, llm: LLMClient) => Promise<WorkResult>> = {
  'github-pr': handlegithubprWork,
  multi: handlemultiWork,
};

export async function dispatchWork(
  ctx: BountyWorkContext,
  llm: LLMClient,
): Promise<WorkResult> {
  const handler = handlers[ctx.deliverableKind];
  if (handler) return handler(ctx, llm);

  const legacy = legacyHandlers[ctx.deliverableKind];
  if (legacy) return legacy(ctx.title, ctx.description, llm);

  return handleJsonWork(ctx, llm);
}
