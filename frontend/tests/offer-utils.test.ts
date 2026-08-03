import { describe, it, expect } from 'vitest';
import {
  isLowStock,
  calculateSavings,
  formatSavingsPercent,
  generatePriceTrend,
  formatPhoneHref,
  formatWhatsAppHref,
  sortCompareListings,
} from '@/lib/offer-utils';

describe('offer-utils', () => {
  it('detects low stock', () => {
    expect(isLowStock(10, 5)).toBe(true);
    expect(isLowStock(100, 5)).toBe(false);
  });

  it('calculates savings vs best price', () => {
    expect(calculateSavings(120, 100)).toBe(20);
    expect(formatSavingsPercent(120, 100)).toBe(17);
  });

  it('generates 30-day price trend', () => {
    const trend = generatePriceTrend('med-1', 100);
    expect(trend).toHaveLength(30);
    expect(trend[trend.length - 1]!.price).toBe(100);
  });

  it('formats phone and WhatsApp links', () => {
    expect(formatPhoneHref('+8801700000001')).toBe('tel:+8801700000001');
    expect(formatWhatsAppHref('01700000001', 'Hello')).toContain('wa.me');
  });

  it('sorts compare listings by price', () => {
    const listings = [
      { finalPrice: 150, expiryDate: '2026-12-01', distanceKm: 5 },
      { finalPrice: 100, expiryDate: '2026-06-01', distanceKm: 2 },
    ];
    const sorted = sortCompareListings(listings, 'price');
    expect(sorted[0]!.finalPrice).toBe(100);
  });
});
