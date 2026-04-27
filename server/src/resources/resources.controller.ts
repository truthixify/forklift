// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Get, Post, Req, Res, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

import { RESOURCE_CATALOG } from './resource-catalog';
import type { PaymentProof } from '@forklift/x402';

@Controller('resources')
export class ResourcesController {
  private readonly logger = new Logger(ResourcesController.name);
  private readonly treasuryAddress: string;
  private readonly usdtAddress: string;
  private readonly chainId: number;

  constructor(private readonly config: ConfigService) {
    this.treasuryAddress =
      this.config.get<string>('PLATFORM_TREASURY_ADDRESS') ??
      '0x33b69cA4EA27Ad2f83AB73cd6bBf635Cf25E5812';
    this.usdtAddress =
      this.config.get<string>('KITE_USDT_ADDRESS') ??
      '0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63';
    this.chainId = Number(this.config.get<string>('KITE_CHAIN_ID') ?? '2368');
  }

  @Get('catalog')
  getCatalog() {
    return { catalog: RESOURCE_CATALOG };
  }

  @Post('inference')
  handleInference(@Req() req: Request, @Res() res: Response) {
    const price = '250000000000000000'; // 0.25 USDT

    const paymentHeader = req.headers['x-402-payment'] as string | undefined;
    if (!paymentHeader) {
      res.status(402).json({
        requirements: {
          paymentAddress: this.treasuryAddress,
          amountUSDT: price,
          chainId: this.chainId,
          usdtAddress: this.usdtAddress,
          resourceUrl: req.originalUrl,
          nonce: randomUUID(),
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

    if (BigInt(proof.amountUSDT) < BigInt(price)) {
      res.status(402).json({ error: 'Insufficient payment amount' });
      return;
    }

    this.logger.log(`x402 inference payment: ${proof.amountUSDT} from ${proof.payerAddress}`);

    const requestBody = req.body as { prompt?: string } | undefined;
    const prompt = requestBody?.prompt ?? 'default';

    res.json({
      result: `Seeded inference response for prompt: "${prompt.slice(0, 100)}"`,
      model: 'premium-inference-v1',
      provider: 'forklift-resource-server',
      paid: proof.amountUSDT,
    });
  }
}
