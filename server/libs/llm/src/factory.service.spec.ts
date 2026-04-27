// Copyright 2025 Forklift. Apache-2.0 license.

import { ConfigService } from '@nestjs/config';
import { LLMProviderFactory } from './factory.service';

function mockConfig(overrides: Record<string, string> = {}): ConfigService {
  return {
    get: (key: string) => overrides[key],
  } as unknown as ConfigService;
}

describe('LLMProviderFactory', () => {
  it('creates a Gemini provider when GEMINI_API_KEY is set', () => {
    const factory = new LLMProviderFactory(mockConfig({ GEMINI_API_KEY: 'test-key' }));
    const client = factory.create({ provider: 'gemini', model: 'gemini-2.5-flash' });

    expect(client.provider).toBe('gemini');
    expect(client.model).toBe('gemini-2.5-flash');
  });

  it('creates an Anthropic provider when ANTHROPIC_API_KEY is set', () => {
    const factory = new LLMProviderFactory(mockConfig({ ANTHROPIC_API_KEY: 'test-key' }));
    const client = factory.create({ provider: 'anthropic', model: 'claude-haiku-4-5' });

    expect(client.provider).toBe('anthropic');
    expect(client.model).toBe('claude-haiku-4-5');
  });

  it('creates an OpenAI provider when OPENAI_API_KEY is set', () => {
    const factory = new LLMProviderFactory(mockConfig({ OPENAI_API_KEY: 'test-key' }));
    const client = factory.create({ provider: 'openai', model: 'gpt-4o-mini' });

    expect(client.provider).toBe('openai');
    expect(client.model).toBe('gpt-4o-mini');
  });

  it('creates an OpenRouter provider when OPENROUTER_API_KEY is set', () => {
    const factory = new LLMProviderFactory(mockConfig({ OPENROUTER_API_KEY: 'test-key' }));
    const client = factory.create({ provider: 'openrouter', model: 'meta-llama/llama-3-8b' });

    expect(client.provider).toBe('openrouter');
    expect(client.model).toBe('meta-llama/llama-3-8b');
  });

  it('uses default provider (gemini) when no config passed', () => {
    const factory = new LLMProviderFactory(mockConfig({ GEMINI_API_KEY: 'test-key' }));
    const client = factory.create();

    expect(client.provider).toBe('gemini');
    expect(client.model).toBe('gemini-2.5-flash');
  });

  it('caches clients by provider:model key', () => {
    const factory = new LLMProviderFactory(mockConfig({ GEMINI_API_KEY: 'test-key' }));
    const a = factory.create({ provider: 'gemini', model: 'gemini-2.5-flash' });
    const b = factory.create({ provider: 'gemini', model: 'gemini-2.5-flash' });

    expect(a).toBe(b);
  });

  it('creates separate clients for different models', () => {
    const factory = new LLMProviderFactory(mockConfig({ GEMINI_API_KEY: 'test-key' }));
    const a = factory.create({ provider: 'gemini', model: 'gemini-2.5-flash' });
    const b = factory.create({ provider: 'gemini', model: 'gemini-2.5-pro' });

    expect(a).not.toBe(b);
  });

  it('throws when API key is missing', () => {
    const factory = new LLMProviderFactory(mockConfig());

    expect(() => factory.create({ provider: 'gemini', model: 'gemini-2.5-flash' })).toThrow(
      'GEMINI_API_KEY not configured',
    );
  });

  it('throws for unknown provider', () => {
    const factory = new LLMProviderFactory(mockConfig());

    expect(() =>
      factory.create({ provider: 'unknown' as 'gemini', model: 'test' }),
    ).toThrow('Unknown LLM provider: unknown');
  });
});
