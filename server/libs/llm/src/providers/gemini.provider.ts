// Copyright 2025 Forklift. Apache-2.0 license.

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ZodSchema } from 'zod';

import type { LLMClient, GenerateStructuredArgs, GenerateTextArgs } from '../client.interface';

export class GeminiProvider implements LLMClient {
  readonly provider = 'gemini';
  private readonly client: GoogleGenerativeAI;

  constructor(
    readonly model: string,
    apiKey: string,
  ) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateStructured<T>(args: GenerateStructuredArgs<T>): Promise<T> {
    const genModel = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: args.maxOutputTokens,
      },
    });

    const result = await genModel.generateContent(args.prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as T;
    return (args.schema as ZodSchema<T>).parse(parsed);
  }

  async generateText(args: GenerateTextArgs): Promise<string> {
    const genModel = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        maxOutputTokens: args.maxOutputTokens,
      },
    });

    const result = await genModel.generateContent(args.prompt);
    return result.response.text();
  }
}
