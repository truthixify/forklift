// Copyright 2025 Forklift. Apache-2.0 license.

export interface PaymentRequirements {
  paymentAddress: string;
  amountUSDT: string;
  chainId: number;
  usdtAddress: string;
  resourceUrl: string;
  nonce: string;
}

export interface PaymentProof {
  txHash: string;
  payerAddress: string;
  amountUSDT: string;
  nonce: string;
}

export interface X402Challenge {
  statusCode: 402;
  requirements: PaymentRequirements;
}

export interface X402PaywallConfig {
  priceUSDT: string;
  recipientAddress: string;
  usdtAddress: string;
  chainId: number;
}
