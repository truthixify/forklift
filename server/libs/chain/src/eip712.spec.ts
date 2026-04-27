// Copyright 2025 Forklift. Apache-2.0 license.

import { hashData } from './eip712';

describe('hashData', () => {
  it('returns a 66-char hex string', () => {
    const hash = hashData('hello world');
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('returns consistent hash for same input', () => {
    const a = hashData('test data');
    const b = hashData('test data');
    expect(a).toBe(b);
  });

  it('returns different hash for different input', () => {
    const a = hashData('input one');
    const b = hashData('input two');
    expect(a).not.toBe(b);
  });

  it('handles empty string', () => {
    const hash = hashData('');
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('handles JSON input', () => {
    const hash = hashData(JSON.stringify({ bountyId: '0x1', agent: '0x2' }));
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
  });
});
