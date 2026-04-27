// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '@forklift/database';
import type { PaymentRequirements, PaymentProof } from './x402.types';

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
  paymentProof: PaymentProof | null;
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

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status !== 402) {
      const data = (await response.json()) as T;
      return { data, paymentProof: null };
    }

    const challenge = (await response.json()) as { requirements: PaymentRequirements };
    const requirements = challenge.requirements;

    this.logger.log(
      `x402 payment required: ${requirements.amountUSDT} USDT for ${url}`,
    );

    const paymentProof = await this.pay(requirements, agentAddress);

    await this.prisma.x402Payment.create({
      data: {
        agentAddress,
        bountyId,
        resourceUrl: url,
        amountUsdt: requirements.amountUSDT,
        txHash: paymentProof.txHash,
      },
    });

    const retryResponse = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-402-Payment': JSON.stringify(paymentProof),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await retryResponse.json()) as T;
    return { data, paymentProof };
  }

  private async pay(
    requirements: PaymentRequirements,
    _agentAddress: string,
  ): Promise<PaymentProof> {
    // In production: use the agent's AA wallet to send USDT to paymentAddress.
    // For hackathon: simulate payment with a mock tx hash since we're
    // calling our own resource server within the same process.
    const nonce = requirements.nonce;
    const txHash = `0x${Buffer.from(nonce).toString('hex').padEnd(64, '0')}`;

    return {
      txHash,
      payerAddress: _agentAddress,
      amountUSDT: requirements.amountUSDT,
      nonce,
    };
  }
}
