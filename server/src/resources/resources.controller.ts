// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Get, Post, Req, Res, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { RESOURCE_CATALOG } from './resource-catalog';
import { SEEDED_LEADS } from './seed/leads';
import { SEEDED_RESEARCH } from './seed/research';
import {
  PIEVERSE_FACILITATOR_URL,
  KITE_TESTNET_USDT,
  KITE_TESTNET_NETWORK,
} from '@forklift/x402';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  private readonly logger = new Logger(ResourcesController.name);
  private readonly payTo: string;

  constructor(private readonly config: ConfigService) {
    this.payTo =
      this.config.get<string>('PLATFORM_TREASURY_ADDRESS') ??
      '0x33b69cA4EA27Ad2f83AB73cd6bBf635Cf25E5812';
  }

  @Get('catalog')
  getCatalog() {
    return { catalog: RESOURCE_CATALOG };
  }

  @Post('inference')
  async handleInference(@Req() req: Request, @Res() res: Response) {
    const price = '250000000000000000'; // 0.25 USDT

    if (!(await this.verifyPayment(req, res, price))) return;

    const body = req.body as { prompt?: string } | undefined;
    const prompt = body?.prompt ?? 'default';

    res.json({
      result: `Seeded inference response for prompt: "${prompt.slice(0, 100)}"`,
      model: 'premium-inference-v1',
      provider: 'forklift-resource-server',
    });
  }

  @Post('dataset/leads')
  async handleLeads(@Req() req: Request, @Res() res: Response) {
    const body = req.body as {
      industry?: string;
      role?: string;
      region?: string;
      limit?: number;
    } | undefined;

    const count = Math.min(body?.limit ?? 10, 50);
    const pricePerRecord = 10000000000000000n;
    const totalPrice = (pricePerRecord * BigInt(count)).toString();

    if (!(await this.verifyPayment(req, res, totalPrice))) return;

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
  async handleResearch(@Req() req: Request, @Res() res: Response) {
    const price = '300000000000000000'; // 0.30 USDT

    if (!(await this.verifyPayment(req, res, price))) return;

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

  private async verifyPayment(req: Request, res: Response, maxAmount: string): Promise<boolean> {
    const paymentHeader = req.headers['x-payment'] as string | undefined;

    if (!paymentHeader) {
      res.status(402).json({
        paymentRequirements: {
          scheme: 'gokite-aa',
          network: KITE_TESTNET_NETWORK,
          maxAmountRequired: maxAmount,
          payTo: this.payTo,
          asset: KITE_TESTNET_USDT,
          maxTimeoutSeconds: 300,
          merchantName: 'forklift-resource-server',
        },
      });
      return false;
    }

    // Verify via Pieverse facilitator
    try {
      const verifyRes = await fetch(`${PIEVERSE_FACILITATOR_URL}/v2/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization: paymentHeader,
          network: KITE_TESTNET_NETWORK,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!verifyRes.ok) {
        this.logger.error(`Payment verify failed: ${verifyRes.status}`);
        res.status(402).json({ error: 'Payment verification failed' });
        return false;
      }

      // Settle on-chain
      const settleRes = await fetch(`${PIEVERSE_FACILITATOR_URL}/v2/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization: paymentHeader,
          network: KITE_TESTNET_NETWORK,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!settleRes.ok) {
        this.logger.error(`Payment settle failed: ${settleRes.status}`);
        res.status(402).json({ error: 'Payment settlement failed' });
        return false;
      }

      const settlement = (await settleRes.json()) as { txHash?: string };
      this.logger.log(`x402 settled: ${settlement.txHash ?? 'confirmed'} for ${req.originalUrl}`);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`x402 error: ${msg}`);
      res.status(500).json({ error: 'Payment processing error' });
      return false;
    }
  }
}
