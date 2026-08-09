import { describe, expect, it } from 'vitest';
import { haversineKm } from '@/lib/geo';

describe('haversineKm', () => {
  it('returns zero for identical coordinates', () => {
    expect(haversineKm(23.7461, 90.3742, 23.7461, 90.3742)).toBeCloseTo(0, 3);
  });

  it('computes distance between two points', () => {
    const km = haversineKm(23.7461, 90.3742, 23.8103, 90.4125);
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(15);
  });
});
