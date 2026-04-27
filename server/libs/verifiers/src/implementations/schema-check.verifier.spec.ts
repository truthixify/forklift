// Copyright 2025 Forklift. Apache-2.0 license.

import { SchemaCheckVerifier } from './schema-check.verifier';
import type { VerifierArgs } from '../verifier.interface';

function makeArgs(overrides: Partial<{
  payloadKind: string;
  payload: Record<string, unknown>;
  schema: Record<string, unknown>;
}>): VerifierArgs {
  return {
    delivery: {
      hash: '0x1',
      bountyId: '0x1',
      agentAddress: '0x1',
      payloadKind: overrides.payloadKind ?? 'json',
      payload: overrides.payload ?? { data: [{ name: 'A', email: 'a@b.c' }] },
      attemptNumber: 1,
    },
    bounty: {
      bountyId: '0x1',
      title: 'Test',
      description: 'Test',
      deliverableSchema: {
        payload: { kind: 'json', schema: overrides.schema ?? { items: { required: ['name', 'email'] } } },
      },
      verifierConfig: { type: 'schema-check', config: {} },
    },
    config: {},
  };
}

describe('SchemaCheckVerifier', () => {
  const verifier = new SchemaCheckVerifier();

  it('passes when all required fields present', async () => {
    const result = await verifier.verify(makeArgs({}));
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1.0);
  });

  it('fails for non-json payload kind', async () => {
    const result = await verifier.verify(makeArgs({ payloadKind: 'file' }));
    expect(result.passed).toBe(false);
  });

  it('fails when required fields are missing', async () => {
    const result = await verifier.verify(makeArgs({
      payload: { data: [{ name: 'A' }] },
    }));
    expect(result.passed).toBe(false);
    expect(result.reasoning).toContain('email');
  });

  it('passes when no schema defined', async () => {
    const result = await verifier.verify(makeArgs({ schema: {} }));
    expect(result.passed).toBe(true);
  });

  it('fails when payload is not an array', async () => {
    const result = await verifier.verify(makeArgs({
      payload: { data: 'not-array' },
      schema: { items: { required: ['name'] } },
    }));
    expect(result.passed).toBe(false);
  });

  it('handles empty array', async () => {
    const result = await verifier.verify(makeArgs({
      payload: { data: [] },
      schema: { items: { required: ['name'] } },
    }));
    expect(result.passed).toBe(true);
  });
});
