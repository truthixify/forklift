// Copyright 2025 Forklift. Apache-2.0 license.

export { LLMModule } from './llm.module';
export { LLMProviderFactory } from './factory.service';
export type {
  LLMClient,
  AIProviderConfig,
  Provider,
  GenerateStructuredArgs,
  GenerateTextArgs,
} from './client.interface';
export { DEFAULT_AI_PROVIDER, PROVIDER_NAMES } from './client.interface';
export { buildParseBriefPrompt } from './prompts/parse-brief.prompt';
export { buildProposalJudgePrompt } from './prompts/proposal-judge.prompt';
export { buildProposalGenPrompt } from './prompts/proposal-gen.prompt';
