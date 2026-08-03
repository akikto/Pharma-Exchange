import { describe, it, expect } from 'vitest';
import { QUERY_STALE_TIMES } from '@/lib/query-config';

describe('query-config', () => {
  it('uses longer stale time for listings than default', () => {
    expect(QUERY_STALE_TIMES.listings).toBeGreaterThan(QUERY_STALE_TIMES.default);
  });

  it('defines cart and orders stale times', () => {
    expect(QUERY_STALE_TIMES.cart).toBeGreaterThan(0);
    expect(QUERY_STALE_TIMES.orders).toBeGreaterThan(0);
  });
});
