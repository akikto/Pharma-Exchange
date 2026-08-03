import { describe, it, expect } from 'vitest';
import { rankMatches, scoreListingMatch } from '../src/modules/ai-match/aiMatch.utils';

describe('aiMatch.utils', () => {
  const base = {
    listingId: 'l1',
    medicineId: 'm1',
    medicineName: 'Napa Extra',
    finalPrice: 120,
    discountPercent: 20,
    availableQty: 100,
    moq: 10,
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 240).toISOString(),
    pharmacyName: 'City Pharmacy',
    targetPrice: 130,
    contextLabel: 'BR-001',
  };

  it('scores higher when below target price and discounted', () => {
    const scored = scoreListingMatch(base);
    expect(scored.score).toBeGreaterThanOrEqual(80);
    expect(scored.reason).toContain('discount');
  });

  it('rankMatches deduplicates and limits results', () => {
    const ranked = rankMatches([
      base,
      { ...base, listingId: 'l2', finalPrice: 140 },
      { ...base, listingId: 'l1' },
    ], 2);
    expect(ranked).toHaveLength(2);
    expect(ranked[0]!.score).toBeGreaterThanOrEqual(ranked[1]!.score);
  });
});
