// Copyright 2025 Forklift. Apache-2.0 license.

import type { Verifier, VerifierArgs, VerifierResult } from '../verifier.interface';
import type { GitHubService } from '@forklift/github';

export class GitHubPRMergedVerifier implements Verifier {
  readonly type = 'github-pr-merged';

  constructor(private readonly github: GitHubService | null) {}

  async verify(args: VerifierArgs): Promise<VerifierResult> {
    const { delivery, bounty } = args;

    if (delivery.payloadKind !== 'github-pr') {
      return {
        passed: false,
        reasoning: `Expected github-pr payload, got ${delivery.payloadKind}`,
        evidence: { expectedKind: 'github-pr', actualKind: delivery.payloadKind },
      };
    }

    const payload = delivery.payload;
    const prNumber = payload['prNumber'] as number | undefined;

    const schema = bounty.deliverableSchema as Record<string, unknown>;
    const payloadDef = schema['payload'] as Record<string, unknown> | undefined;
    const repoFullName = payloadDef?.['repo'] as string | undefined;
    const expectedBase = payloadDef?.['baseBranch'] as string | undefined;

    if (!prNumber || !repoFullName) {
      return {
        passed: false,
        reasoning: 'Missing prNumber or repo in delivery payload / schema',
        evidence: { prNumber, repo: repoFullName },
      };
    }

    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) {
      return {
        passed: false,
        reasoning: `Invalid repo format: ${repoFullName} (expected owner/repo)`,
        evidence: { repo: repoFullName },
      };
    }

    if (this.github) {
      try {
        const result = await this.github.checkPRMerged(owner, repo, prNumber);

        if (expectedBase && result.baseBranch !== expectedBase) {
          return {
            passed: false,
            reasoning: `PR merged into ${result.baseBranch}, expected ${expectedBase}`,
            evidence: { ...result, expectedBase },
          };
        }

        return {
          passed: result.merged,
          score: result.merged ? 1.0 : 0,
          reasoning: result.merged
            ? `PR #${prNumber} merged into ${result.baseBranch}`
            : `PR #${prNumber} not yet merged`,
          evidence: { prNumber, repo: repoFullName, ...result },
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return {
          passed: false,
          reasoning: `GitHub API check failed: ${msg}`,
          evidence: { prNumber, repo: repoFullName, error: msg },
        };
      }
    }

    const merged = payload['merged'] as boolean | undefined;
    return {
      passed: merged === true,
      score: merged ? 1.0 : 0,
      reasoning: merged ? `PR #${prNumber} merged (self-reported)` : `PR #${prNumber} not merged`,
      evidence: { prNumber, repo: repoFullName, merged: merged ?? false, source: 'payload' },
    };
  }
}
