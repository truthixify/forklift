// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execSync } from 'node:child_process';

import { PrismaService } from '@forklift/database';
import type { X402ChallengeResponse } from './x402.types';

interface X402RequestOptions {
  url: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  agentAddress: string;
  bountyId: string;
}

interface X402Response<T = unknown> {
  data: T;
  paid: boolean;
  txHash: string | null;
}

@Injectable()
export class X402Client {
  private readonly logger = new Logger(X402Client.name);

  constructor(
    _config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async request<T = unknown>(options: X402RequestOptions): Promise<X402Response<T>> {
    const { url, method = 'POST', body, headers = {}, agentAddress, bountyId } = options;

    // First request — may get 402
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status !== 402) {
      const data = (await response.json()) as T;
      return { data, paid: false, txHash: null };
    }

    // Got 402 — extract payment requirements
    const challenge = (await response.json()) as X402ChallengeResponse;
    this.logger.log(
      `x402 payment required: ${challenge.paymentRequirements.maxAmountRequired} for ${url}`,
    );

    // Execute payment via kpass CLI (Passport session-based)
    const result = this.executeViaPassport(url, method, body, headers);

    if (result) {
      // Record the payment in ledger
      await this.prisma.x402Payment.create({
        data: {
          agentAddress,
          bountyId,
          resourceUrl: url,
          amountUsdt: challenge.paymentRequirements.maxAmountRequired,
          txHash: result.txHash,
        },
      });

      return { data: result.data as T, paid: true, txHash: result.txHash };
    }

    throw new Error(`x402 payment failed for ${url}`);
  }

  private executeViaPassport(
    url: string,
    method: string,
    body: unknown,
    headers: Record<string, string>,
  ): { data: unknown; txHash: string } | null {
    try {
      const args = [
        'kpass agent:session execute',
        `--url "${url}"`,
        `--method ${method}`,
        '--output json',
        '--no-interactive',
      ];

      if (body) {
        args.push(`--body '${JSON.stringify(body)}'`);
      }

      if (Object.keys(headers).length > 0) {
        args.push(`--headers '${JSON.stringify(headers)}'`);
      }

      const output = execSync(args.join(' '), {
        timeout: 30_000,
        encoding: 'utf8',
      });

      const parsed = JSON.parse(output) as {
        response?: { body?: unknown };
        payment?: { txHash?: string };
      };

      return {
        data: parsed.response?.body ?? parsed,
        txHash: parsed.payment?.txHash ?? '',
      };
    } catch (error) {
      this.logger.error('kpass execute failed, falling back to direct x402', error);
      return this.executeDirectX402(url, method, body, headers);
    }
  }


  private executeDirectX402(
    _url: string,
    _method: string,
    _body: unknown,
    _headers: Record<string, string>,
  ): { data: unknown; txHash: string } | null {
    // Direct x402 requires signing a TransferWithAuthorization
    // via the agent's session key — handled by kpass in the primary path
    this.logger.warn('Direct x402 payment not available without kpass');
    return null;
  }
}
