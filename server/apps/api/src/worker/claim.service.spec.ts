// Copyright 2025 Forklift. Apache-2.0 license.

import { ClaimService } from './claim.service';
import type { WorkerProfile } from './worker-profile';

const pixelProfile: WorkerProfile = {
  name: 'pixel',
  displayName: 'Forklift · Pixel',
  passportAddress: '0x0000000000000000000000000000000000000002',
  specialization: {
    templates: ['logo-design'],
    deliverableKinds: ['file'],
    willStretch: false,
    claimThreshold: 0.5,
    minBountyUSDT: '1000000000000000000',     // 1 USDT
    maxBountyUSDT: '50000000000000000000',     // 50 USDT
  },
  etaModel: { trivial: 60, small: 180, medium: 600, large: 1200 },
  aiProvider: { provider: 'gemini', model: 'gemini-2.5-flash' },
  spendCaps: { perTaskUSDT: '1000000000000000000', globalDailyUSDT: '10000000000000000000' },
};

const stretchProfile: WorkerProfile = {
  ...pixelProfile,
  name: 'stretchy',
  specialization: {
    ...pixelProfile.specialization,
    willStretch: true,
  },
};

function makeBounty(overrides: Partial<{
  templateId: string | null;
  deliverableKind: string;
  amount: string;
}> = {}) {
  return {
    bountyId: '0x1234',
    title: 'Test bounty',
    description: 'Test description',
    templateId: 'logo-design' as string | null,
    deliverableKind: 'file',
    amount: '5000000000000000000', // 5 USDT
    ...overrides,
  };
}

describe('ClaimService.shouldClaim', () => {
  let service: ClaimService;

  beforeEach(() => {
    service = new ClaimService(null as never, null as never);
  });

  it('claims matching template and kind', () => {
    expect(service.shouldClaim(pixelProfile, makeBounty())).toBe(true);
  });

  it('rejects mismatched template when willStretch=false', () => {
    expect(
      service.shouldClaim(pixelProfile, makeBounty({ templateId: 'lead-gen' })),
    ).toBe(false);
  });

  it('accepts mismatched template when willStretch=true', () => {
    expect(
      service.shouldClaim(stretchProfile, makeBounty({ templateId: 'lead-gen', deliverableKind: 'file' })),
    ).toBe(true);
  });

  it('rejects mismatched deliverable kind when willStretch=false', () => {
    expect(
      service.shouldClaim(pixelProfile, makeBounty({ deliverableKind: 'json' })),
    ).toBe(false);
  });

  it('rejects bounty below min amount', () => {
    expect(
      service.shouldClaim(pixelProfile, makeBounty({ amount: '100000000000000000' })),
    ).toBe(false);
  });

  it('rejects bounty above max amount', () => {
    expect(
      service.shouldClaim(pixelProfile, makeBounty({ amount: '100000000000000000000' })),
    ).toBe(false);
  });

  it('claims when templateId is null and templates list is non-empty', () => {
    expect(
      service.shouldClaim(pixelProfile, makeBounty({ templateId: null })),
    ).toBe(true);
  });
});
