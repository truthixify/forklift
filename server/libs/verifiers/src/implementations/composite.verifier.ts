// Copyright 2025 Forklift. Apache-2.0 license.

import type { Verifier, VerifierArgs, VerifierResult } from '../verifier.interface';
import type { VerifierRegistry } from '../registry';

interface ChildVerifierConfig {
  type: string;
  config: Record<string, unknown>;
}

export class CompositeVerifier implements Verifier {
  readonly type = 'composite';

  constructor(private readonly registry: VerifierRegistry) {}

  async verify(args: VerifierArgs): Promise<VerifierResult> {
    const { config } = args;
    const operator = (config['operator'] as string) ?? 'AND';
    const children = (config['children'] as ChildVerifierConfig[]) ?? [];

    if (children.length === 0) {
      return { passed: true, score: 1.0, reasoning: 'No child verifiers configured', evidence: {} };
    }

    const results: Array<{ type: string; result: VerifierResult }> = [];

    for (const child of children) {
      const verifier = this.registry.get(child.type);
      if (!verifier) {
        results.push({
          type: child.type,
          result: { passed: false, reasoning: `Unknown verifier type: ${child.type}`, evidence: {} },
        });
        continue;
      }

      const result = await verifier.verify({ ...args, config: child.config });
      results.push({ type: child.type, result });
    }

    const allPassed = results.every((r) => r.result.passed);
    const anyPassed = results.some((r) => r.result.passed);
    const passed = operator === 'AND' ? allPassed : anyPassed;

    const scores = results.map((r) => r.result.score).filter((s): s is number => s !== undefined);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined;

    const childSummary = results.map((r) => `${r.type}: ${r.result.passed ? 'PASS' : 'FAIL'}${r.result.score !== undefined ? ` (${r.result.score.toFixed(2)})` : ''}`);

    return {
      passed,
      score: avgScore,
      reasoning: `Composite(${operator}): ${childSummary.join(', ')}`,
      evidence: {
        operator,
        children: results.map((r) => ({ type: r.type, ...r.result })),
      },
    };
  }
}
