// Copyright 2025 Forklift. Apache-2.0 license.

import type { Verifier, VerifierArgs, VerifierResult } from '../verifier.interface';

export class WebhookCallbackVerifier implements Verifier {
  readonly type = 'webhook-callback';

  async verify(args: VerifierArgs): Promise<VerifierResult> {
    const { delivery, config } = args;

    const callbackUrl = config['url'] as string | undefined;
    if (!callbackUrl) {
      return {
        passed: false,
        reasoning: 'No callback URL configured',
        evidence: { config },
      };
    }

    try {
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryHash: delivery.hash,
          bountyId: delivery.bountyId,
          payloadKind: delivery.payloadKind,
          payload: delivery.payload,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        return {
          passed: false,
          reasoning: `Webhook returned HTTP ${response.status}`,
          evidence: { callbackUrl, status: response.status },
        };
      }

      const body = (await response.json()) as { passed?: boolean; reasoning?: string };

      return {
        passed: body.passed === true,
        reasoning: body.reasoning ?? (body.passed ? 'Webhook approved' : 'Webhook rejected'),
        evidence: { callbackUrl, webhookResponse: body },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        passed: false,
        reasoning: `Webhook call failed: ${message}`,
        evidence: { callbackUrl, error: message },
      };
    }
  }
}
