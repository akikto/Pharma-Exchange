import { describe, expect, it } from 'vitest';
import { isNavItemActive } from '@/components/layout/nav-config';
import { buyerNav } from '@/components/layout/nav-config';

describe('Buyer home navigation', () => {
  it('keeps marketplace Home active only on /', () => {
    const home = buyerNav[0];
    expect(isNavItemActive('/', home)).toBe(true);
    expect(isNavItemActive('/admin', home)).toBe(false);
    expect(isNavItemActive('/admin/sellers', home)).toBe(false);
  });
});
