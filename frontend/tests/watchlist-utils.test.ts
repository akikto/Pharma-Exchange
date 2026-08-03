import { describe, it, expect } from 'vitest';
import { trendLabel } from '@/lib/watchlist-utils';

describe('watchlist-utils', () => {
  it('maps price trend to label keys', () => {
    expect(trendLabel('DOWN')).toBe('down');
    expect(trendLabel('UP')).toBe('up');
    expect(trendLabel('STABLE')).toBe('stable');
  });
});
