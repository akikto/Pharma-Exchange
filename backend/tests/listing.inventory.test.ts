import { describe, it, expect } from 'vitest';
import { resolveLowStockThreshold, isListingLowStock } from '../src/modules/listing/listing.service';
import { ListingStatus } from '@prisma/client';

describe('inventory low-stock helpers', () => {
  it('uses explicit lowStockThreshold when set', () => {
    expect(resolveLowStockThreshold({ availableQty: 100, moq: 5, lowStockThreshold: 15 })).toBe(15);
  });

  it('defaults to max(moq * 2, 20)', () => {
    expect(resolveLowStockThreshold({ availableQty: 100, moq: 5 })).toBe(20);
    expect(resolveLowStockThreshold({ availableQty: 100, moq: 15 })).toBe(30);
  });

  it('detects low stock for active listings at or below threshold', () => {
    const base = { moq: 10, lowStockThreshold: 25, status: ListingStatus.ACTIVE };
    expect(isListingLowStock({ ...base, availableQty: 25 })).toBe(true);
    expect(isListingLowStock({ ...base, availableQty: 26 })).toBe(false);
    expect(isListingLowStock({ ...base, availableQty: 25, status: ListingStatus.PAUSED })).toBe(false);
  });
});
