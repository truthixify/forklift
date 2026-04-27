// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';

import type { Verifier, VerifierArgs, VerifierResult } from './verifier.interface';
import { LLMProviderFactory } from '@forklift/llm';
import { SchemaCheckVerifier } from './implementations/schema-check.verifier';
import { FileCheckVerifier } from './implementations/file-check.verifier';
import { LLMJudgeVerifier } from './implementations/llm-judge.verifier';
import { GitHubPRMergedVerifier } from './implementations/github-pr-merged.verifier';
import { WebhookCallbackVerifier } from './implementations/webhook-callback.verifier';
import { CompositeVerifier } from './implementations/composite.verifier';

@Injectable()
export class VerifierRegistry {
  private readonly logger = new Logger(VerifierRegistry.name);
  private readonly verifiers = new Map<string, Verifier>();

  constructor(llmFactory: LLMProviderFactory) {
    const llm = llmFactory.create();

    this.register(new SchemaCheckVerifier());
    this.register(new FileCheckVerifier());
    this.register(new LLMJudgeVerifier(llm));
    this.register(new GitHubPRMergedVerifier());
    this.register(new WebhookCallbackVerifier());
    this.register(new CompositeVerifier(this));

    this.logger.log(`Registered ${this.verifiers.size} verifiers`);
  }

  private register(verifier: Verifier) {
    this.verifiers.set(verifier.type, verifier);
  }

  get(type: string): Verifier | undefined {
    return this.verifiers.get(type);
  }

  async verify(args: VerifierArgs): Promise<VerifierResult> {
    const type = args.bounty.verifierConfig.type;
    const verifier = this.verifiers.get(type);

    if (!verifier) {
      return {
        passed: false,
        reasoning: `Unknown verifier type: ${type}`,
        evidence: { requestedType: type, availableTypes: Array.from(this.verifiers.keys()) },
      };
    }

    const config = args.bounty.verifierConfig.config;
    return verifier.verify({ ...args, config });
  }
}
