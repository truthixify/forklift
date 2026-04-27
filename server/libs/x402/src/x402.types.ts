// Copyright 2025 Forklift. Apache-2.0 license.

// --- x402 Provider Side (Resource Server returning 402) ---

export interface X402PaymentRequirements {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  payTo: string;
  asset: string;
  maxTimeoutSeconds: number;
  merchantName: string;
  outputSchema?: Record<string, unknown>;
}

export interface X402PaywallConfig {
  payTo: string;
  asset: string;
  network: string;
  merchantName: string;
  maxTimeoutSeconds?: number;
}

// --- x402 Consumer Side (Agent paying for resources) ---

export interface X402ChallengeResponse {
  paymentRequirements: X402PaymentRequirements;
}

// --- Pieverse Facilitator ---

export const PIEVERSE_FACILITATOR_URL = 'https://facilitator.pieverse.io';
export const PIEVERSE_KITE_TESTNET_ADDRESS = '0x12343e649e6b2b2b77649DFAb88f103c02F3C78b';

export const KITE_TESTNET_USDT = '0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63';
export const KITE_TESTNET_NETWORK = 'kite-testnet';
