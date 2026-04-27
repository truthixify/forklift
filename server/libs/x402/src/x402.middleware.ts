// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

import type { X402PaywallConfig, PaymentProof } from './x402.types';

@Injectable()
export class X402PaywallMiddleware implements NestMiddleware {
  private readonly logger = new Logger(X402PaywallMiddleware.name);

  constructor(private readonly config: X402PaywallConfig) {}

  use(req: Request, res: Response, next: NextFunction) {
    const paymentHeader = req.headers['x-402-payment'] as string | undefined;

    if (!paymentHeader) {
      const nonce = randomUUID();
      res.status(402).json({
        requirements: {
          paymentAddress: this.config.recipientAddress,
          amountUSDT: this.config.priceUSDT,
          chainId: this.config.chainId,
          usdtAddress: this.config.usdtAddress,
          resourceUrl: req.originalUrl,
          nonce,
        },
      });
      return;
    }

    let proof: PaymentProof;
    try {
      proof = JSON.parse(paymentHeader) as PaymentProof;
    } catch {
      res.status(400).json({ error: 'Invalid X-402-Payment header' });
      return;
    }

    if (BigInt(proof.amountUSDT) < BigInt(this.config.priceUSDT)) {
      res.status(402).json({ error: 'Insufficient payment amount' });
      return;
    }

    this.logger.log(
      `x402 payment verified: ${proof.amountUSDT} USDT from ${proof.payerAddress}`,
    );

    next();
  }
}

export function createPaywallMiddleware(config: X402PaywallConfig): X402PaywallMiddleware {
  return new X402PaywallMiddleware(config);
}
