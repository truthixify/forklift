// Copyright 2025 Forklift. Apache-2.0 license.

export interface DeliverableSchema {
  version: '1.0';
  payload: PayloadDef;
  examples?: Array<{ description: string; value: unknown }>;
  notes?: string;
}

export type PayloadDef =
  | { kind: 'url'; mediaType?: string; mustResolve?: boolean }
  | { kind: 'file'; mimeTypes: string[]; maxSizeBytes: number }
  | { kind: 'json'; schema: Record<string, unknown> }
  | { kind: 'github-pr'; repo: string; baseBranch: string }
  | { kind: 'multi'; parts: Record<string, PayloadDef> };

export interface VerifierConfig {
  type: VerifierType;
  config: Record<string, unknown>;
}

export const VERIFIER_TYPES = [
  'schema-check',
  'file-check',
  'github-pr-merged',
  'llm-judge',
  'webhook-callback',
  'composite',
] as const;

export type VerifierType = (typeof VERIFIER_TYPES)[number];

export interface Template {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  defaultDeliverable: DeliverableSchema;
  defaultVerifier: VerifierConfig;
  suggestedAmountRangeUSDT: [string, string];
  suggestedDeadlineSec: number;
  parsingHints: string;
  estimatedResourceCostUSDT: string;
}
