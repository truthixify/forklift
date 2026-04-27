// Copyright 2025 Forklift. Apache-2.0 license.

export const RESOURCE_CATALOG = [
  {
    path: '/api/resources/inference',
    name: 'Premium AI inference',
    description: 'Proxy access to premium models without a subscription.',
    pricePerCallUSDT: '250000000000000000', // 0.25 USDT
    notes: 'Pay per request; no commitment.',
  },
  {
    path: '/api/resources/dataset/leads',
    name: 'Curated lead database',
    description: 'B2B contact records matching targeting criteria.',
    pricePerRecordUSDT: '10000000000000000', // 0.01 USDT per record
    notes: 'Filter by industry, role, region, funding stage.',
  },
  {
    path: '/api/resources/dataset/research',
    name: 'Curated research material',
    description: 'Long-form research material on common topics.',
    pricePerCallUSDT: '300000000000000000', // 0.30 USDT
    notes: 'Returns 5–10 source-cited research snippets.',
  },
] as const;
