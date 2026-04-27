// Copyright 2025 Forklift. Apache-2.0 license.

import { GitHubPRMergedVerifier } from './github-pr-merged.verifier';
import type { VerifierArgs } from '../verifier.interface';

function makeArgs(overrides: {
  payloadKind?: string;
  merged?: boolean;
  prUrl?: string;
  prNumber?: number;
} = {}): VerifierArgs {
  return {
    delivery: {
      hash: '0x1', bountyId: '0x1', agentAddress: '0x1',
      payloadKind: overrides.payloadKind ?? 'github-pr',
      payload: {
        prUrl: overrides.prUrl ?? 'https://github.com/org/repo/pull/1',
        prNumber: overrides.prNumber ?? 1,
        merged: overrides.merged ?? false,
      },
      attemptNumber: 1,
    },
    bounty: {
      bountyId: '0x1', title: 'Test', description: 'Test',
      deliverableSchema: { payload: { kind: 'github-pr', repo: 'org/repo', baseBranch: 'main' } },
      verifierConfig: { type: 'github-pr-merged', config: {} },
    },
    config: {},
  };
}

describe('GitHubPRMergedVerifier', () => {
  const verifier = new GitHubPRMergedVerifier();

  it('passes when PR is merged', async () => {
    const result = await verifier.verify(makeArgs({ merged: true }));
    expect(result.passed).toBe(true);
  });

  it('fails when PR is not merged', async () => {
    const result = await verifier.verify(makeArgs({ merged: false }));
    expect(result.passed).toBe(false);
  });

  it('fails for non-github-pr payload kind', async () => {
    const result = await verifier.verify(makeArgs({ payloadKind: 'json' }));
    expect(result.passed).toBe(false);
  });

  it('fails when no PR URL or number', async () => {
    const args = makeArgs();
    args.delivery.payload = {};
    const result = await verifier.verify(args);
    expect(result.passed).toBe(false);
  });
});
