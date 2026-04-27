// Copyright 2025 Forklift. Apache-2.0 license.

import { GoogleGenAI } from '@google/generative-ai';
import type { ZodSchema } from 'zod';

import type { LLMClient, GenerateStructuredArgs, GenerateTextArgs } from '../client.interface';

export class GeminiProvider implements LLMClient {
  readonly provider = 'gemini';
  private readonly client: GoogleGenAI;

  constructor(
    readonly model: string,
    apiKey: string,
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateStructured<T>(args: GenerateStructuredArgs<T>): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), args.timeout ?? 15_000);

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: args.prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: args.maxOutputTokens,
        },
      });

      const text = response.text ?? '';
      const parsed = JSON.parse(text) as T;
      return (args.schema as ZodSchema<T>).parse(parsed);
    } finally {
      clearTimeout(timer);
    }
  }

  async generateText(args: GenerateTextArgs): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), args.timeout ?? 15_000);

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: args.prompt,
        config: {
          maxOutputTokens: args.maxOutputTokens,
        },
      });

      return response.text ?? '';
    } finally {
      clearTimeout(timer);
    }
  }
}
