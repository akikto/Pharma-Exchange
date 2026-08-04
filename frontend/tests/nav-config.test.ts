import { describe, expect, it } from 'vitest';
import { buyerNav, sellerNav, getNavItems } from '@/components/layout/nav-config';

describe('nav-config', () => {
  it('buyer nav: home, cart, watchlist, chat, profile', () => {
    expect(buyerNav).toHaveLength(5);
    expect(buyerNav.map((n) => n.labelKey)).toEqual(['home', 'cart', 'watchlist', 'chat', 'profile']);
    expect(buyerNav.find((n) => n.badgeKey === 'cart')).toBeTruthy();
    expect(buyerNav.find((n) => n.badgeKey === 'watchlist')).toBeTruthy();
    expect(buyerNav.find((n) => n.badgeKey === 'chat')).toBeTruthy();
  });

  it('seller nav: dashboard, orders, inventory, chat, profile', () => {
    expect(sellerNav).toHaveLength(5);
    expect(sellerNav[0].to).toBe('/seller');
    expect(sellerNav[0].labelKey).toBe('dashboard');
    expect(sellerNav.find((n) => n.to === '/seller/orders')).toBeTruthy();
    expect(sellerNav.find((n) => n.badgeKey === 'requests')).toBeTruthy();
  });

  it('getNavItems returns correct set by mode', () => {
    expect(getNavItems('buyer')).toBe(buyerNav);
    expect(getNavItems('seller')).toBe(sellerNav);
  });
});
