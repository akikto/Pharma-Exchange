import { describe, expect, it } from 'vitest';
import { HOME_GUTTER_CLASS, HOME_HERO_GAP_CLASS } from '@/components/home/home-layout';

describe('home layout tokens', () => {
  it('uses the same horizontal gutter as the app bar (px-3)', () => {
    expect(HOME_GUTTER_CLASS).toBe('px-3');
  });

  it('uses a 10px hero vertical gap', () => {
    expect(HOME_HERO_GAP_CLASS).toBe('gap-2.5');
  });
});
