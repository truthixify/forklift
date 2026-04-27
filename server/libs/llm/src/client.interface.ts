// Copyright 2025 Forklift. Apache-2.0 license.

import type { ZodSchema } from 'zod';

export interface GenerateStructuredArgs<T> {
  prompt: string;
  schema: ZodSchema<T>;
  timeout?: number;
  maxOutputTokens?: number;
}

export interface GenerateTextArgs {
  prompt: string;
  timeout?: number;
  maxOutputTokens?: number;
}

export interface LLMClient {
  readonly provider: string;
  readonly model: string;

  generateStructured<T>(args: GenerateStructuredArgs<T>): Promise<T>;
  generateText(args: GenerateTextArgs): Promise<string>;
}

export const PROVIDER_NAMES = ['gemini', 'anthropic', 'openai', 'openrouter'] as const;
export type Provider = (typeof PROVIDER_NAMES)[number];

export interface AIProviderConfig {
  provider: Provider;
  model: string;
}

export const DEFAULT_AI_PROVIDER: AIProviderConfig = {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
};

export const SUPPORTED_PROVIDERS = {
  gemini: { name: 'Google Gemini', models: ['gemini-2.5-flash', 'gemini-2.5-pro'] },
  anthropic: { name: 'Anthropic Claude', models: ['claude-haiku-4-5', 'claude-sonnet-4-6'] },
  openai: { name: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4o'] },
  openrouter: { name: 'OpenRouter', models: ['user-specified'] },
} as const;
