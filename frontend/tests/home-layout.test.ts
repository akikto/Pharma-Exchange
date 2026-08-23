import { describe, expect, it } from 'vitest';
import {
  HOME_CARD_SHELL_CLASS,
  HOME_GUTTER_CLASS,
  HOME_PROMO_BANNER_SPACING_CLASS,
} from '@/components/home/home-layout';

describe('home layout tokens', () => {
  it('does not double-stack shell gutter (inset is on .edge-to-edge only)', () => {
    expect(HOME_GUTTER_CLASS).toBe('');
  });

  it('uses mb-3 (12px) below the promo banner', () => {
    expect(HOME_PROMO_BANNER_SPACING_CLASS).toBe('mb-3');
  });

  it('defines a shared card shell for banner and shop', () => {
    expect(HOME_CARD_SHELL_CLASS).toContain('border');
    expect(HOME_CARD_SHELL_CLASS).toContain('w-full');
  });
});
