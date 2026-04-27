// Copyright 2025 Forklift. Apache-2.0 license.

import type { Template } from '../template.interface';

export const logoDesignTemplate: Template = {
  id: 'logo-design',
  name: 'Logo Design',
  category: 'Design',
  shortDescription: 'Professional logo in PNG/SVG format',
  defaultDeliverable: {
    version: '1.0',
    payload: {
      kind: 'file',
      mimeTypes: ['image/png', 'image/svg+xml'],
      maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    },
    notes: 'Deliver a high-quality logo. Transparent background preferred. Scalable format (SVG) preferred.',
  },
  defaultVerifier: {
    type: 'composite',
    config: {
      operator: 'AND',
      children: [
        {
          type: 'file-check',
          config: {
            allowedMimeTypes: ['image/png', 'image/svg+xml'],
            maxSizeBytes: 10 * 1024 * 1024,
          },
        },
        {
          type: 'llm-judge',
          config: {
            rubric: 'Evaluate the logo: matches the brief, looks professional, transparent background if requested, scalable.',
            passThreshold: 0.6,
          },
        },
      ],
    },
  },
  suggestedAmountRangeUSDT: ['5000000000000000000', '50000000000000000000'], // 5–50 USDT
  suggestedDeadlineSec: 1800, // 30 min
  parsingHints: 'Look for mentions of logo, brand, icon, graphic, vector, SVG, PNG. Extract color preferences, style hints, brand name.',
  estimatedResourceCostUSDT: '250000000000000000', // 0.25 USDT (inference call)
};
