import { describe, expect, it } from 'vitest';
import { buyerNav, sellerNav, getNavItems } from '@/components/layout/nav-config';

describe('nav-config', () => {
  it('buyer nav has 5 tabs with cart and chat badges', () => {
    expect(buyerNav).toHaveLength(5);
    expect(buyerNav.find((n) => n.badgeKey === 'cart')).toBeTruthy();
    expect(buyerNav.find((n) => n.badgeKey === 'chat')).toBeTruthy();
  });

  it('seller nav swaps cart for dashboard and requests badge', () => {
    expect(sellerNav).toHaveLength(5);
    expect(sellerNav[0].to).toBe('/seller');
    expect(sellerNav.find((n) => n.badgeKey === 'requests')).toBeTruthy();
  });

  it('getNavItems returns correct set by mode', () => {
    expect(getNavItems('buyer')).toBe(buyerNav);
    expect(getNavItems('seller')).toBe(sellerNav);
  });
});
