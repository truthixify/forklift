// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

import {
  type X402PaywallConfig,
  PIEVERSE_FACILITATOR_URL,
  KITE_TESTNET_USDT,
  KITE_TESTNET_NETWORK,
} from './x402.types';

@Injectable()
export class X402PaywallMiddleware implements NestMiddleware {
  private readonly logger = new Logger(X402PaywallMiddleware.name);

  constructor(private readonly config: X402PaywallConfig) {}

  use(req: Request, res: Response, next: NextFunction) {
    const paymentHeader = req.headers['x-payment'] as string | undefined;

    if (!paymentHeader) {
      res.status(402).json({
        paymentRequirements: {
          scheme: 'gokite-aa',
          network: this.config.network ?? KITE_TESTNET_NETWORK,
          maxAmountRequired: (req as Request & { x402Price?: string }).x402Price ?? '0',
          payTo: this.config.payTo,
          asset: this.config.asset ?? KITE_TESTNET_USDT,
          maxTimeoutSeconds: this.config.maxTimeoutSeconds ?? 300,
          merchantName: this.config.merchantName,
        },
      });
      return;
    }

    void this.verifyAndSettle(paymentHeader, req, res, next);
  }

  private async verifyAndSettle(
    paymentHeader: string,
    _req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // Verify the payment authorization via Pieverse facilitator
      const verifyResponse = await fetch(`${PIEVERSE_FACILITATOR_URL}/v2/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization: paymentHeader,
          network: this.config.network ?? KITE_TESTNET_NETWORK,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.text();
        this.logger.error(`Pieverse verify failed: ${verifyResponse.status} ${error}`);
        res.status(402).json({ error: 'Payment verification failed' });
        return;
      }

      // Settle the payment on-chain via Pieverse facilitator
      const settleResponse = await fetch(`${PIEVERSE_FACILITATOR_URL}/v2/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization: paymentHeader,
          network: this.config.network ?? KITE_TESTNET_NETWORK,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!settleResponse.ok) {
        const error = await settleResponse.text();
        this.logger.error(`Pieverse settle failed: ${settleResponse.status} ${error}`);
        res.status(402).json({ error: 'Payment settlement failed' });
        return;
      }

      const settlement = (await settleResponse.json()) as { txHash?: string };
      this.logger.log(`x402 payment settled: ${settlement.txHash ?? 'confirmed'}`);

      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`x402 verification error: ${message}`);
      res.status(500).json({ error: 'Payment processing error' });
    }
  }
}

export function createPaywallMiddleware(config: X402PaywallConfig): X402PaywallMiddleware {
  return new X402PaywallMiddleware(config);
}
