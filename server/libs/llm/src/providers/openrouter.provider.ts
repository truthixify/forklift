// Copyright 2025 Forklift. Apache-2.0 license.

import OpenAI from 'openai';
import type { ZodSchema } from 'zod';

import type { LLMClient, GenerateStructuredArgs, GenerateTextArgs } from '../client.interface';

export class OpenRouterProvider implements LLMClient {
  readonly provider = 'openrouter';
  private readonly client: OpenAI;

  constructor(
    readonly model: string,
    apiKey: string,
  ) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  async generateStructured<T>(args: GenerateStructuredArgs<T>): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: args.maxOutputTokens ?? 4096,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `${args.prompt}\n\nRespond with valid JSON only.`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(text) as T;
    return (args.schema as ZodSchema<T>).parse(parsed);
  }

  async generateText(args: GenerateTextArgs): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: args.maxOutputTokens ?? 4096,
      messages: [{ role: 'user', content: args.prompt }],
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
