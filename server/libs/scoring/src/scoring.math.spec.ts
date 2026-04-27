// Copyright 2025 Forklift. Apache-2.0 license.

import {
  computeRelevance,
  computeReliability,
  computeFreshness,
  computeProbationMultiplier,
} from './scoring.math';

function makeStats(overrides: Partial<{
  paid: number;
  rejected: number;
  ghosted: number;
  withdrawn: number;
  disputesLost: number;
  lastActiveAt: Date | null;
}> = {}) {
  return {
    paid: 0,
    rejected: 0,
    ghosted: 0,
    withdrawn: 0,
    disputesLost: 0,
    lastActiveAt: null,
    ...overrides,
  };
}

describe('computeRelevance', () => {
  it('returns 0.30 for cold start (no attempts)', () => {
    expect(computeRelevance(makeStats(), null, 'json')).toBeCloseTo(0.3, 2);
  });

  it('returns 1.0 for perfect track record', () => {
    expect(computeRelevance(makeStats({ paid: 10 }), null, 'json')).toBeCloseTo(1.0, 2);
  });

  it('penalizes rejections at 0.5x', () => {
    const stats = makeStats({ paid: 5, rejected: 2 });
    const score = computeRelevance(stats, null, 'json');
    // (5 - 0.5*2 - 1.0*0) / 7 = 4/7 ≈ 0.571
    expect(score).toBeCloseTo(4 / 7, 2);
  });

  it('penalizes ghosts at 1.0x', () => {
    const stats = makeStats({ paid: 5, ghosted: 3 });
    const score = computeRelevance(stats, null, 'json');
    // (5 - 0*0 - 1.0*3) / 8 = 2/8 = 0.25
    expect(score).toBeCloseTo(0.25, 2);
  });

  it('clamps to 0 when heavily ghosted', () => {
    const stats = makeStats({ paid: 1, ghosted: 10 });
    expect(computeRelevance(stats, null, 'json')).toBe(0);
  });
});

describe('computeReliability', () => {
  it('returns 0.5 for cold start', () => {
    expect(computeReliability(makeStats())).toBeCloseTo(0.5, 2);
  });

  it('returns 1.0 for perfect acceptance', () => {
    expect(computeReliability(makeStats({ paid: 10 }))).toBeCloseTo(1.0, 2);
  });

  it('subtracts ghost rate', () => {
    const stats = makeStats({ paid: 7, ghosted: 3 });
    // acceptance=0.7, ghost_rate=0.3, dispute=0 → 0.7-0.3=0.4
    expect(computeReliability(stats)).toBeCloseTo(0.4, 2);
  });

  it('subtracts dispute loss rate at 0.5x', () => {
    const stats = makeStats({ paid: 8, disputesLost: 2 });
    // acceptance=0.8, ghost=0, dispute_loss=0.2 → 0.8 - 0 - 0.5*0.2 = 0.7
    expect(computeReliability(stats)).toBeCloseTo(0.7, 2);
  });

  it('clamps to 0', () => {
    const stats = makeStats({ ghosted: 10 });
    expect(computeReliability(stats)).toBe(0);
  });
});

describe('computeFreshness', () => {
  it('returns 0.5 for cold start (null)', () => {
    expect(computeFreshness(null)).toBeCloseTo(0.5, 2);
  });

  it('returns 1.0 for activity within 7 days', () => {
    const recent = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(computeFreshness(recent)).toBeCloseTo(1.0, 2);
  });

  it('returns 0.8 for activity within 30 days', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    expect(computeFreshness(twoWeeksAgo)).toBeCloseTo(0.8, 2);
  });

  it('returns 0.5 for activity within 90 days', () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    expect(computeFreshness(sixtyDaysAgo)).toBeCloseTo(0.5, 2);
  });

  it('returns 0.3 for activity within 365 days', () => {
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    expect(computeFreshness(sixMonthsAgo)).toBeCloseTo(0.3, 2);
  });

  it('returns 0.1 for activity older than 365 days', () => {
    const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
    expect(computeFreshness(twoYearsAgo)).toBeCloseTo(0.1, 2);
  });
});

describe('computeProbationMultiplier', () => {
  it('returns 0.70 for 0 paid', () => {
    expect(computeProbationMultiplier(0)).toBe(0.7);
  });

  it('returns 0.70 for 2 paid', () => {
    expect(computeProbationMultiplier(2)).toBe(0.7);
  });

  it('returns 0.90 for 3 paid', () => {
    expect(computeProbationMultiplier(3)).toBe(0.9);
  });

  it('returns 0.90 for 9 paid', () => {
    expect(computeProbationMultiplier(9)).toBe(0.9);
  });

  it('returns 1.00 for 10 paid', () => {
    expect(computeProbationMultiplier(10)).toBe(1.0);
  });

  it('returns 1.00 for 100 paid', () => {
    expect(computeProbationMultiplier(100)).toBe(1.0);
  });
});
