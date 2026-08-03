import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';

describe('i18n', () => {
  it('defaults to Bengali', () => {
    expect(i18n.language).toMatch(/^bn/);
  });

  it('has English fallback keys', () => {
    expect(i18n.t('nav.home', { lng: 'bn' })).toBe('হোম');
    expect(i18n.t('nav.home', { lng: 'en' })).toBe('Home');
    expect(i18n.t('home.title', { lng: 'en' })).toBe('Home');
  });

  it('supports interpolation', () => {
    expect(i18n.t('shell.cartItems', { count: 3, lng: 'en' })).toContain('3');
  });
});
