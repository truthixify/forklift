// Copyright 2025 Forklift. Apache-2.0 license.

import { X402PaywallMiddleware } from './x402.middleware';
import type { X402PaywallConfig } from './x402.types';
import type { Request, Response, NextFunction } from 'express';

const config: X402PaywallConfig = {
  payTo: '0xTREASURY',
  asset: '0xUSDT',
  network: 'kite-testnet',
  merchantName: 'test-service',
  maxTimeoutSeconds: 300,
};

function mockReq(headers: Record<string, string> = {}, price = '250000000000000000'): Request {
  return {
    headers,
    originalUrl: '/resources/inference',
    x402Price: price,
  } as unknown as Request;
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

  it('returns 402 with x402 payment requirements when no X-Payment header', () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    middleware.use(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(402);
    const body = res.body as Record<string, Record<string, unknown>>;
    expect(body['paymentRequirements']).toBeDefined();
    expect(body['paymentRequirements']['scheme']).toBe('gokite-aa');
    expect(body['paymentRequirements']['network']).toBe('kite-testnet');
    expect(body['paymentRequirements']['payTo']).toBe('0xTREASURY');
    expect(body['paymentRequirements']['asset']).toBe('0xUSDT');
    expect(body['paymentRequirements']['merchantName']).toBe('test-service');
    expect(next).not.toHaveBeenCalled();
  });

  it('includes maxTimeoutSeconds in requirements', () => {
    const req = mockReq();
    const res = mockRes();
    const next: NextFunction = jest.fn();

    middleware.use(req, res as unknown as Response, next);

    const body = res.body as Record<string, Record<string, unknown>>;
    expect(body['paymentRequirements']['maxTimeoutSeconds']).toBe(300);
  });
});
