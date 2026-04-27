// Copyright 2025 Forklift. Apache-2.0 license.

import Anthropic from '@anthropic-ai/sdk';
import type { ZodSchema } from 'zod';

import type { LLMClient, GenerateStructuredArgs, GenerateTextArgs } from '../client.interface';

export class AnthropicProvider implements LLMClient {
  readonly provider = 'anthropic';
  private readonly client: Anthropic;

  constructor(
    readonly model: string,
    apiKey: string,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async generateStructured<T>(args: GenerateStructuredArgs<T>): Promise<T> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: args.maxOutputTokens ?? 4096,
      messages: [
        {
          role: 'user',
          content: `${args.prompt}\n\nRespond with valid JSON only, no markdown fences.`,
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const parsed = JSON.parse(text) as T;
    return (args.schema as ZodSchema<T>).parse(parsed);
  }

  async generateText(args: GenerateTextArgs): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: args.maxOutputTokens ?? 4096,
      messages: [{ role: 'user', content: args.prompt }],
    });

    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
  }
}
