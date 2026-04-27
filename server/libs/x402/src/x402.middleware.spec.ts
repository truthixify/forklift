// Copyright 2025 Forklift. Apache-2.0 license.

import { X402PaywallMiddleware } from './x402.middleware';
import type { X402PaywallConfig } from './x402.types';
import type { Request, Response, NextFunction } from 'express';

const config: X402PaywallConfig = {
  priceUSDT: '250000000000000000',
  recipientAddress: '0xTREASURY',
  usdtAddress: '0xUSDT',
  chainId: 2368,
};

function mockReq(headers: Record<string, string> = {}): Request {
  return { headers, originalUrl: '/resources/inference' } as unknown as Request;
}

function mockRes() {
  const res = {
    statusCode: 0,
    body: null as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('X402PaywallMiddleware', () => {
  let middleware: X402PaywallMiddleware;

  beforeEach(() => {
    middleware = new X402PaywallMiddleware(config);
  });

  it('returns 402 with payment requirements when no payment header', () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    middleware.use(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(402);
    expect((res.body as Record<string, unknown>)['requirements']).toBeDefined();
    const requirements = (res.body as Record<string, Record<string, unknown>>)['requirements'];
    expect(requirements['paymentAddress']).toBe('0xTREASURY');
    expect(requirements['amountUSDT']).toBe('250000000000000000');
    expect(requirements['chainId']).toBe(2368);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid payment header', () => {
    const req = mockReq({ 'x-402-payment': 'not-json' });
    const res = mockRes();
    const next = jest.fn();

    middleware.use(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 402 for insufficient payment', () => {
    const proof = JSON.stringify({
      txHash: '0xabc',
      payerAddress: '0xagent',
      amountUSDT: '100000000000000000', // 0.1 USDT < 0.25 required
      nonce: 'test',
    });
    const req = mockReq({ 'x-402-payment': proof });
    const res = mockRes();
    const next = jest.fn();

    middleware.use(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(402);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for valid payment', () => {
    const proof = JSON.stringify({
      txHash: '0xabc',
      payerAddress: '0xagent',
      amountUSDT: '250000000000000000',
      nonce: 'test',
    });
    const req = mockReq({ 'x-402-payment': proof });
    const res = mockRes();
    const next = jest.fn();

    middleware.use(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('calls next for overpayment', () => {
    const proof = JSON.stringify({
      txHash: '0xabc',
      payerAddress: '0xagent',
      amountUSDT: '500000000000000000', // 0.5 > 0.25 required
      nonce: 'test',
    });
    const req = mockReq({ 'x-402-payment': proof });
    const res = mockRes();
    const next = jest.fn();

    middleware.use(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('includes nonce in requirements', () => {
    const req = mockReq();
    const res = mockRes();
    const next: NextFunction = jest.fn();

    middleware.use(req, res as unknown as Response, next);

    const requirements = (res.body as Record<string, Record<string, unknown>>)['requirements'];
    expect(requirements['nonce']).toBeDefined();
    expect(typeof requirements['nonce']).toBe('string');
  });
});
