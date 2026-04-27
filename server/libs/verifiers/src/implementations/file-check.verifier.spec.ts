// Copyright 2025 Forklift. Apache-2.0 license.

import { FileCheckVerifier } from './file-check.verifier';
import type { VerifierArgs } from '../verifier.interface';

function makeArgs(overrides: {
  payloadKind?: string;
  mimeType?: string;
  sizeBytes?: number;
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
} = {}): VerifierArgs {
  return {
    delivery: {
      hash: '0x1', bountyId: '0x1', agentAddress: '0x1',
      payloadKind: overrides.payloadKind ?? 'file',
      payload: { mimeType: overrides.mimeType ?? 'image/png', sizeBytes: overrides.sizeBytes ?? 5000 },
      attemptNumber: 1,
    },
    bounty: {
      bountyId: '0x1', title: 'Test', description: 'Test',
      deliverableSchema: {},
      verifierConfig: { type: 'file-check', config: {} },
    },
    config: {
      allowedMimeTypes: overrides.allowedMimeTypes ?? ['image/png', 'image/svg+xml'],
      maxSizeBytes: overrides.maxSizeBytes ?? 10485760,
    },
  };
}

describe('FileCheckVerifier', () => {
  const verifier = new FileCheckVerifier();

  it('passes for valid file', async () => {
    const result = await verifier.verify(makeArgs());
    expect(result.passed).toBe(true);
  });

  it('fails for non-file payload kind', async () => {
    const result = await verifier.verify(makeArgs({ payloadKind: 'json' }));
    expect(result.passed).toBe(false);
  });

  it('fails for disallowed MIME type', async () => {
    const result = await verifier.verify(makeArgs({ mimeType: 'application/pdf' }));
    expect(result.passed).toBe(false);
    expect(result.reasoning).toContain('MIME type');
  });

  it('fails when file exceeds max size', async () => {
    const result = await verifier.verify(makeArgs({ sizeBytes: 20000000, maxSizeBytes: 10485760 }));
    expect(result.passed).toBe(false);
    expect(result.reasoning).toContain('exceeds');
  });

  it('fails when mimeType is missing', async () => {
    const args = makeArgs();
    delete (args.delivery.payload as Record<string, unknown>)['mimeType'];
    const result = await verifier.verify(args);
    expect(result.passed).toBe(false);
  });

  it('passes without config constraints', async () => {
    const args = makeArgs();
    args.config = {};
    const result = await verifier.verify(args);
    expect(result.passed).toBe(true);
  });
});
