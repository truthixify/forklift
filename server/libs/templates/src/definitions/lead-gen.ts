// Copyright 2025 Forklift. Apache-2.0 license.

import type { Template } from '../template.interface';

export const leadGenTemplate: Template = {
  id: 'lead-gen',
  name: 'Lead Generation',
  category: 'Data',
  shortDescription: 'Curated list of B2B contacts matching your criteria',
  defaultDeliverable: {
    version: '1.0',
    payload: {
      kind: 'json',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'title', 'company', 'email'],
          properties: {
            name: { type: 'string' },
            title: { type: 'string' },
            company: { type: 'string' },
            email: { type: 'string', format: 'email' },
            linkedin: { type: 'string' },
          },
        },
      },
    },
    notes: 'Deliver a JSON array of lead records matching the brief targeting criteria.',
  },
  defaultVerifier: {
    type: 'composite',
    config: {
      operator: 'AND',
      children: [
        {
          type: 'schema-check',
          config: {},
        },
        {
          type: 'llm-judge',
          config: {
            rubric: 'Sample 3 records. Verify they match the brief targeting criteria (industry, role, region, etc.).',
            passThreshold: 0.6,
          },
        },
      ],
    },
  },
  suggestedAmountRangeUSDT: ['5000000000000000000', '25000000000000000000'], // 5–25 USDT
  suggestedDeadlineSec: 900, // 15 min
  parsingHints: 'Look for mentions of leads, contacts, prospects, sales, B2B, outreach. Extract targeting: industry, role, region, company size, funding stage.',
  estimatedResourceCostUSDT: '500000000000000000', // 0.50 USDT (dataset call)
};
