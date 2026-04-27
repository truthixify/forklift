// Copyright 2025 Forklift. Apache-2.0 license.

import type { Verifier, VerifierArgs, VerifierResult } from '../verifier.interface';

export class FileCheckVerifier implements Verifier {
  readonly type = 'file-check';

  async verify(args: VerifierArgs): Promise<VerifierResult> {
    const { delivery, config } = args;

    if (delivery.payloadKind !== 'file') {
      return {
        passed: false,
        reasoning: `Expected file payload, got ${delivery.payloadKind}`,
        evidence: { expectedKind: 'file', actualKind: delivery.payloadKind },
      };
    }

    const payload = delivery.payload;
    const mimeType = payload['mimeType'] as string | undefined;
    const sizeBytes = payload['sizeBytes'] as number | undefined;

    const allowedMimes = config['allowedMimeTypes'] as string[] | undefined;
    const maxSize = config['maxSizeBytes'] as number | undefined;

    const errors: string[] = [];
    const evidence: Record<string, unknown> = { mimeType, sizeBytes };

    if (allowedMimes && mimeType && !allowedMimes.includes(mimeType)) {
      errors.push(`MIME type ${mimeType} not in allowed list: ${allowedMimes.join(', ')}`);
    }

    if (maxSize && sizeBytes && sizeBytes > maxSize) {
      errors.push(`File size ${sizeBytes} exceeds max ${maxSize}`);
    }

    if (!mimeType) {
      errors.push('Missing mimeType in delivery payload');
    }

    if (errors.length > 0) {
      return {
        passed: false,
        reasoning: errors.join('; '),
        evidence: { ...evidence, errors },
      };
    }

    return {
      passed: true,
      score: 1.0,
      reasoning: `File check passed: ${mimeType}, ${sizeBytes} bytes`,
      evidence,
    };
  }
}
