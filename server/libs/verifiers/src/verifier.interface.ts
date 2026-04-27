// Copyright 2025 Forklift. Apache-2.0 license.

export interface VerifierArgs {
  delivery: DeliveryPayload;
  bounty: BountyContext;
  config: Record<string, unknown>;
}

export interface VerifierResult {
  passed: boolean;
  score?: number;
  reasoning: string;
  evidence: Record<string, unknown>;
}

export interface Verifier {
  readonly type: string;
  verify(args: VerifierArgs): Promise<VerifierResult>;
}

export interface DeliveryPayload {
  hash: string;
  bountyId: string;
  agentAddress: string;
  payloadKind: string;
  payload: Record<string, unknown>;
  attemptNumber: number;
}

export interface BountyContext {
  bountyId: string;
  title: string;
  description: string;
  deliverableSchema: Record<string, unknown>;
  verifierConfig: { type: string; config: Record<string, unknown> };
}
