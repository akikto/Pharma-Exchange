import { describe, it, expect } from 'vitest';
import { haversineKm } from '../src/shared/utils/geo';

describe('haversineKm', () => {
  it('returns ~0 for identical coordinates', () => {
    expect(haversineKm(23.7461, 90.3742, 23.7461, 90.3742)).toBeCloseTo(0, 3);
  });

  it('computes distance between two Dhaka points', () => {
    const km = haversineKm(23.7461, 90.3742, 23.8103, 90.4125);
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(15);
  });
});
