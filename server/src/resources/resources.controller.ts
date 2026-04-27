// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Get, Post, Req, Res, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

import { RESOURCE_CATALOG } from './resource-catalog';
import { SEEDED_LEADS } from './seed/leads';
import { SEEDED_RESEARCH } from './seed/research';
import type { PaymentProof } from '@forklift/x402';

@ApiTags('resources')
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
    const price = '250000000000000000';

    if (!this.verifyPayment(req, res, price)) return;

    const body = req.body as { prompt?: string } | undefined;
    const prompt = body?.prompt ?? 'default';

    res.json({
      result: `Seeded inference response for prompt: "${prompt.slice(0, 100)}"`,
      model: 'premium-inference-v1',
      provider: 'forklift-resource-server',
    });
  }

  @Post('dataset/leads')
  handleLeads(@Req() req: Request, @Res() res: Response) {
    const body = req.body as {
      industry?: string;
      role?: string;
      region?: string;
      limit?: number;
    } | undefined;

    const count = Math.min(body?.limit ?? 10, 50);
    const pricePerRecord = 10000000000000000n; // 0.01 USDT
    const totalPrice = (pricePerRecord * BigInt(count)).toString();

    if (!this.verifyPayment(req, res, totalPrice)) return;

    let leads = SEEDED_LEADS;

    if (body?.industry) {
      leads = leads.filter((l) => l.industry.toLowerCase().includes(body.industry!.toLowerCase()));
    }
    if (body?.role) {
      leads = leads.filter((l) => l.title.toLowerCase().includes(body.role!.toLowerCase()));
    }
    if (body?.region) {
      leads = leads.filter((l) => l.region.toLowerCase().includes(body.region!.toLowerCase()));
    }

    res.json({
      records: leads.slice(0, count),
      totalAvailable: leads.length,
      returned: Math.min(count, leads.length),
    });
  }

  @Post('dataset/research')
  handleResearch(@Req() req: Request, @Res() res: Response) {
    const price = '300000000000000000'; // 0.30 USDT

    if (!this.verifyPayment(req, res, price)) return;

    const body = req.body as { topic?: string } | undefined;
    const topic = body?.topic?.toLowerCase() ?? '';

    let results = SEEDED_RESEARCH;
    if (topic) {
      results = results.filter((r) =>
        r.topic.toLowerCase().includes(topic) ||
        r.snippets.some((s) => s.text.toLowerCase().includes(topic)),
      );
    }

    if (results.length === 0) {
      results = SEEDED_RESEARCH.slice(0, 3);
    }

    res.json({
      topic: body?.topic ?? 'general',
      results: results.slice(0, 5),
    });
  }

  private verifyPayment(req: Request, res: Response, requiredAmount: string): boolean {
    const paymentHeader = req.headers['x-402-payment'] as string | undefined;

    if (!paymentHeader) {
      res.status(402).json({
        requirements: {
          paymentAddress: this.treasuryAddress,
          amountUSDT: requiredAmount,
          chainId: this.chainId,
          usdtAddress: this.usdtAddress,
          resourceUrl: req.originalUrl,
          nonce: randomUUID(),
        },
      });
      return false;
    }

    let proof: PaymentProof;
    try {
      proof = JSON.parse(paymentHeader) as PaymentProof;
    } catch {
      res.status(400).json({ error: 'Invalid X-402-Payment header' });
      return false;
    }

    if (BigInt(proof.amountUSDT) < BigInt(requiredAmount)) {
      res.status(402).json({ error: 'Insufficient payment amount' });
      return false;
    }

    this.logger.log(`x402 payment: ${proof.amountUSDT} from ${proof.payerAddress} for ${req.originalUrl}`);
    return true;
  }
}
