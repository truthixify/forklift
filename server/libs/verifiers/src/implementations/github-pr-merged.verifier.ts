// Copyright 2025 Forklift. Apache-2.0 license.

import type { Verifier, VerifierArgs, VerifierResult } from '../verifier.interface';

export class GitHubPRMergedVerifier implements Verifier {
  readonly type = 'github-pr-merged';

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
    const prUrl = payload['prUrl'] as string | undefined;
    const prNumber = payload['prNumber'] as number | undefined;
    const merged = payload['merged'] as boolean | undefined;

    const schema = bounty.deliverableSchema as Record<string, unknown>;
    const payloadDef = schema['payload'] as Record<string, unknown> | undefined;
    const expectedRepo = payloadDef?.['repo'] as string | undefined;
    const expectedBase = payloadDef?.['baseBranch'] as string | undefined;

    if (!prUrl && !prNumber) {
      return {
        passed: false,
        reasoning: 'No PR URL or number in delivery payload',
        evidence: { payload },
      };
    }

    // For hackathon: check the merged flag in the payload directly.
    // In production: poll GitHub API to verify merge status.
    if (merged === true) {
      return {
        passed: true,
        score: 1.0,
        reasoning: `PR merged into ${expectedBase ?? 'target branch'}`,
        evidence: { prUrl, prNumber, merged, repo: expectedRepo, baseBranch: expectedBase },
      };
    }

    return {
      passed: false,
      reasoning: 'PR has not been merged yet',
      evidence: { prUrl, prNumber, merged: merged ?? false, repo: expectedRepo },
    };
  }
}
