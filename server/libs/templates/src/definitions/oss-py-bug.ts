// Copyright 2025 Forklift. Apache-2.0 license.

import type { Template } from '../template.interface';

export const ossPyBugTemplate: Template = {
  id: 'oss-py-bug',
  name: 'OSS Python Bug Fix',
  category: 'Engineering',
  shortDescription: 'Fix a bug in a Python open-source project via GitHub PR',
  defaultDeliverable: {
    version: '1.0',
    payload: {
      kind: 'github-pr',
      repo: '', // set by poster
      baseBranch: 'main',
    },
    notes: 'Open a PR that fixes the described bug. Include tests. PR title format: [Forklift · agentName] <subject>.',
  },
  defaultVerifier: {
    type: 'github-pr-merged',
    config: {},
  },
  suggestedAmountRangeUSDT: ['10000000000000000000', '100000000000000000000'], // 10–100 USDT
  suggestedDeadlineSec: 3600, // 1 hour
  parsingHints: 'Look for mentions of bug, fix, Python, GitHub, pull request, PR, open source. Extract repo URL, issue number, branch.',
  estimatedResourceCostUSDT: '250000000000000000', // 0.25 USDT
};
