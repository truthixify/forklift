// Copyright 2025 Forklift. Apache-2.0 license.

export interface WorkerProfile {
  name: string;
  displayName: string;
  passportAddress: string;
  specialization: {
    templates: string[];
    deliverableKinds: string[];
    willStretch: boolean;
    claimThreshold: number;
    minBountyUSDT: string;
    maxBountyUSDT: string;
  };
  etaModel: {
    trivial: number;
    small: number;
    medium: number;
    large: number;
  };
  aiProvider: {
    provider: string;
    model: string;
  };
  spendCaps: {
    perTaskUSDT: string;
    globalDailyUSDT: string;
  };
}

export const DEMO_PROFILES: WorkerProfile[] = [
  {
    name: 'hauler',
    displayName: 'Forklift · Hauler',
    passportAddress: '0x0000000000000000000000000000000000000001',
    specialization: {
      templates: ['oss-py-docs', 'oss-py-bug'],
      deliverableKinds: ['github-pr'],
      willStretch: false,
      claimThreshold: 0.6,
      minBountyUSDT: '1000000000000000000',
      maxBountyUSDT: '100000000000000000000',
    },
    etaModel: { trivial: 120, small: 300, medium: 900, large: 1800 },
    aiProvider: { provider: 'gemini', model: 'gemini-2.5-flash' },
    spendCaps: {
      perTaskUSDT: '2000000000000000000',
      globalDailyUSDT: '20000000000000000000',
    },
  },
  {
    name: 'pixel',
    displayName: 'Forklift · Pixel',
    passportAddress: '0x0000000000000000000000000000000000000002',
    specialization: {
      templates: ['logo-design', 'social-graphic', 'infographic'],
      deliverableKinds: ['file'],
      willStretch: false,
      claimThreshold: 0.5,
      minBountyUSDT: '1000000000000000000',
      maxBountyUSDT: '50000000000000000000',
    },
    etaModel: { trivial: 60, small: 180, medium: 600, large: 1200 },
    aiProvider: { provider: 'gemini', model: 'gemini-2.5-flash' },
    spendCaps: {
      perTaskUSDT: '1000000000000000000',
      globalDailyUSDT: '10000000000000000000',
    },
  },
  {
    name: 'pallet',
    displayName: 'Forklift · Pallet',
    passportAddress: '0x0000000000000000000000000000000000000003',
    specialization: {
      templates: ['lead-gen', 'data-extraction'],
      deliverableKinds: ['json'],
      willStretch: true,
      claimThreshold: 0.4,
      minBountyUSDT: '1000000000000000000',
      maxBountyUSDT: '25000000000000000000',
    },
    etaModel: { trivial: 60, small: 180, medium: 600, large: 1200 },
    aiProvider: { provider: 'gemini', model: 'gemini-2.5-flash' },
    spendCaps: {
      perTaskUSDT: '2000000000000000000',
      globalDailyUSDT: '20000000000000000000',
    },
  },
  {
    name: 'boomer',
    displayName: 'Forklift · Boomer',
    passportAddress: '0x0000000000000000000000000000000000000004',
    specialization: {
      templates: ['logo-design', 'research-brief', 'oss-generic'],
      deliverableKinds: ['file', 'json', 'github-pr'],
      willStretch: true,
      claimThreshold: 0.3,
      minBountyUSDT: '1000000000000000000',
      maxBountyUSDT: '100000000000000000000',
    },
    etaModel: { trivial: 180, small: 600, medium: 1200, large: 2400 },
    aiProvider: { provider: 'gemini', model: 'gemini-2.5-flash' },
    spendCaps: {
      perTaskUSDT: '1000000000000000000',
      globalDailyUSDT: '5000000000000000000',
    },
  },
  {
    name: 'quill',
    displayName: 'Forklift · Quill',
    passportAddress: '0x0000000000000000000000000000000000000005',
    specialization: {
      templates: ['research-brief', 'blog-post', 'copywriting'],
      deliverableKinds: ['json', 'file'],
      willStretch: false,
      claimThreshold: 0.5,
      minBountyUSDT: '1000000000000000000',
      maxBountyUSDT: '50000000000000000000',
    },
    etaModel: { trivial: 120, small: 300, medium: 900, large: 1800 },
    aiProvider: { provider: 'gemini', model: 'gemini-2.5-flash' },
    spendCaps: {
      perTaskUSDT: '1500000000000000000',
      globalDailyUSDT: '15000000000000000000',
    },
  },
];
