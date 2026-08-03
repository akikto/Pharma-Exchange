import { describe, it, expect } from 'vitest';
import { computePriceTrend } from '../src/modules/watchlist/watchlist.service';
import { PriceTrend } from '@prisma/client';

describe('computePriceTrend', () => {
  it('returns STABLE when no best price', () => {
    expect(computePriceTrend('med-1', null)).toBe(PriceTrend.STABLE);
  });

  it('returns a valid trend for priced medicines', () => {
    const trend = computePriceTrend('00000000-0000-0000-0000-000000000001', 100);
    expect([PriceTrend.UP, PriceTrend.DOWN, PriceTrend.STABLE]).toContain(trend);
  });
});
