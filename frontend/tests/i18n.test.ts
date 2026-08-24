import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';

describe('i18n', () => {
  it('defaults to English (English-only UI)', () => {
    expect(i18n.language).toMatch(/^en/);
  });

  it('renders English nav labels', () => {
    expect(i18n.t('nav.home')).toBe('Home');
    expect(i18n.t('nav.cart')).toBe('Cart');
    expect(i18n.t('home.title')).toBe('Home');
  });

  it('supports interpolation', () => {
    expect(i18n.t('shell.cartItems', { count: 3 })).toContain('3');
  });
});
