// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { LLMClient, AIProviderConfig } from './client.interface';
import { DEFAULT_AI_PROVIDER } from './client.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';

@Injectable()
export class LLMProviderFactory {
  private readonly logger = new Logger(LLMProviderFactory.name);
  private readonly cache = new Map<string, LLMClient>();

  constructor(private readonly config: ConfigService) {}

  create(providerConfig?: AIProviderConfig): LLMClient {
    const cfg = providerConfig ?? DEFAULT_AI_PROVIDER;
    const cacheKey = `${cfg.provider}:${cfg.model}`;

    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const client = this.buildClient(cfg);
    this.cache.set(cacheKey, client);
    this.logger.log(`Created LLM client: ${cfg.provider}/${cfg.model}`);
    return client;
  }

  private buildClient(cfg: AIProviderConfig): LLMClient {
    switch (cfg.provider) {
      case 'gemini': {
        const key = this.config.get<string>('GEMINI_API_KEY');
        if (!key) throw new Error('GEMINI_API_KEY not configured');
        return new GeminiProvider(cfg.model, key);
      }
      case 'anthropic': {
        const key = this.config.get<string>('ANTHROPIC_API_KEY');
        if (!key) throw new Error('ANTHROPIC_API_KEY not configured');
        return new AnthropicProvider(cfg.model, key);
      }
      case 'openai': {
        const key = this.config.get<string>('OPENAI_API_KEY');
        if (!key) throw new Error('OPENAI_API_KEY not configured');
        return new OpenAIProvider(cfg.model, key);
      }
      case 'openrouter': {
        const key = this.config.get<string>('OPENROUTER_API_KEY');
        if (!key) throw new Error('OPENROUTER_API_KEY not configured');
        return new OpenRouterProvider(cfg.model, key);
      }
      default:
        throw new Error(`Unknown LLM provider: ${cfg.provider}`);
    }
  }
}
