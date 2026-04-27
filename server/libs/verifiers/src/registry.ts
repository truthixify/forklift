// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';

import type { Verifier, VerifierArgs, VerifierResult } from './verifier.interface';
import { LLMProviderFactory } from '@forklift/llm';
import { GitHubService } from '@forklift/github';
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
  private readonly llmFactory: LLMProviderFactory;
  private llmJudgeRegistered = false;

  constructor(llmFactory: LLMProviderFactory, github: GitHubService) {
    this.llmFactory = llmFactory;

    this.register(new SchemaCheckVerifier());
    this.register(new FileCheckVerifier());
    this.register(new GitHubPRMergedVerifier(github));
    this.register(new WebhookCallbackVerifier());
    this.register(new CompositeVerifier(this));

    this.logger.log(`Registered ${this.verifiers.size} verifiers (llm-judge deferred)`);
  }

  private register(verifier: Verifier) {
    this.verifiers.set(verifier.type, verifier);
  }

  private ensureLLMJudge() {
    if (this.llmJudgeRegistered) return;
    try {
      const llm = this.llmFactory.create();
      this.register(new LLMJudgeVerifier(llm));
      this.llmJudgeRegistered = true;
    } catch {
      this.logger.warn('LLM judge verifier unavailable — no API key configured');
    }
  }

  get(type: string): Verifier | undefined {
    if (type === 'llm-judge') this.ensureLLMJudge();
    return this.verifiers.get(type);
  }

  async verify(args: VerifierArgs): Promise<VerifierResult> {
    const type = args.bounty.verifierConfig.type;
    const verifier = this.get(type);

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
