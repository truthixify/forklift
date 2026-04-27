// Copyright 2025 Forklift. Apache-2.0 license.

import type { Verifier, VerifierArgs, VerifierResult } from '../verifier.interface';

export class SchemaCheckVerifier implements Verifier {
  readonly type = 'schema-check';

  async verify(args: VerifierArgs): Promise<VerifierResult> {
    const { delivery, bounty } = args;
    const evidence: Record<string, unknown> = {};

    if (delivery.payloadKind !== 'json') {
      return {
        passed: false,
        reasoning: `Expected JSON payload, got ${delivery.payloadKind}`,
        evidence: { expectedKind: 'json', actualKind: delivery.payloadKind },
      };
    }

    const payload = delivery.payload;
    const schema = (bounty.deliverableSchema as Record<string, unknown>)['payload'] as Record<string, unknown> | undefined;
    const jsonSchema = schema?.['schema'] as Record<string, unknown> | undefined;

    if (!jsonSchema) {
      return { passed: true, score: 1.0, reasoning: 'No JSON schema defined; payload accepted', evidence };
    }

    const requiredFields = (jsonSchema['items'] as Record<string, unknown>)?.['required'] as string[] | undefined;
    if (!requiredFields) {
      return { passed: true, score: 1.0, reasoning: 'No required fields in schema; payload accepted', evidence };
    }

    const data = payload['data'] as unknown;
    if (!Array.isArray(data)) {
      return {
        passed: false,
        reasoning: 'Expected array payload',
        evidence: { expectedType: 'array', actualType: typeof data },
      };
    }

    const missingFields: string[] = [];
    for (const record of data.slice(0, 5) as Record<string, unknown>[]) {
      for (const field of requiredFields) {
        if (!(field in record)) {
          missingFields.push(field);
        }
      }
    }

    const uniqueMissing = [...new Set(missingFields)];
    if (uniqueMissing.length > 0) {
      return {
        passed: false,
        score: 1 - uniqueMissing.length / requiredFields.length,
        reasoning: `Missing required fields: ${uniqueMissing.join(', ')}`,
        evidence: { missingFields: uniqueMissing, sampleSize: Math.min(data.length, 5) },
      };
    }

    return {
      passed: true,
      score: 1.0,
      reasoning: `All ${requiredFields.length} required fields present in ${Math.min(data.length, 5)} sampled records`,
      evidence: { requiredFields, recordCount: data.length, sampleSize: Math.min(data.length, 5) },
    };
  }
}
