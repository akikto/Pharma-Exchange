import { describe, it, expect } from 'vitest';
import { formatMatchScore, matchScoreVariant } from '@/lib/ai-match-utils';

describe('ai-match-utils', () => {
  it('formats score as percent', () => {
    expect(formatMatchScore(82.4)).toBe('82%');
  });

  it('maps score to variant', () => {
    expect(matchScoreVariant(85)).toBe('success');
    expect(matchScoreVariant(65)).toBe('warning');
    expect(matchScoreVariant(40)).toBe('default');
  });
});
