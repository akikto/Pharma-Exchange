import { describe, it, expect } from 'vitest';
import {
  resolveLowStockThreshold,
  isListingLowStock,
  buildInventoryQuery,
} from '@/lib/inventory-utils';
import type { Listing } from '@/types';

const baseListing = {
  id: '1',
  batchNumber: 'B1',
  mfgDate: '2025-01-01',
  expiryDate: '2026-01-01',
  sellingPrice: 10,
  discountPercent: 0,
  finalPrice: 10,
  availableQty: 10,
  moq: 5,
  unit: 'strip',
  status: 'ACTIVE',
  medicine: {
    id: 'm1',
    name: 'Test',
    company: 'Co',
    dosageForm: 'TABLET',
    packSize: '10',
    category: 'Pain',
  },
  pharmacy: {
    id: 'p1',
    name: 'Pharm',
    city: 'Dhaka',
    rating: 4,
    verificationStatus: 'APPROVED',
  },
} as Listing;

describe('inventory-utils', () => {
  it('resolveLowStockThreshold uses explicit value or default', () => {
    expect(resolveLowStockThreshold({ ...baseListing, lowStockThreshold: 12 })).toBe(12);
    expect(resolveLowStockThreshold({ ...baseListing, moq: 5 })).toBe(20);
    expect(resolveLowStockThreshold({ ...baseListing, moq: 15 })).toBe(30);
  });

  it('isListingLowStock checks active listings only', () => {
    expect(isListingLowStock({ ...baseListing, availableQty: 10, lowStockThreshold: 15 })).toBe(true);
    expect(isListingLowStock({ ...baseListing, availableQty: 20, lowStockThreshold: 15 })).toBe(false);
    expect(isListingLowStock({ ...baseListing, status: 'PAUSED', availableQty: 5, lowStockThreshold: 15 })).toBe(false);
  });

  it('buildInventoryQuery encodes tab and search', () => {
    expect(buildInventoryQuery('ACTIVE', '')).toContain('status=ACTIVE');
    expect(buildInventoryQuery('LOW_STOCK', 'para')).toContain('filter=low_stock');
    expect(buildInventoryQuery('LOW_STOCK', 'para')).toContain('q=para');
  });
});
