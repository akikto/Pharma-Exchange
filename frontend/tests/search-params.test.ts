import { describe, it, expect } from 'vitest';
import { countActiveFilters, clearAllFilters, setParam, toggleParam } from '@/lib/search-params';
import { homeFilterToParams, HOME_QUICK_FILTERS } from '@/lib/search-constants';

describe('search-params', () => {
  it('counts active advanced and chip filters', () => {
    const sp = new URLSearchParams('category=Analgesic&maxPrice=500&verifiedOnly=true');
    expect(countActiveFilters(sp)).toBe(3);
  });

  it('clearAllFilters keeps query and resets sort', () => {
    const sp = new URLSearchParams('q=Napa&category=Analgesic&sortBy=price');
    const next = clearAllFilters(sp);
    expect(next.get('q')).toBe('Napa');
    expect(next.get('category')).toBeNull();
    expect(next.get('sortBy')).toBe('recommended');
  });

  it('toggleParam toggles chip values', () => {
    const sp = new URLSearchParams();
    const on = toggleParam(sp, 'dosageForm', 'TABLET');
    expect(on.get('dosageForm')).toBe('TABLET');
    const off = toggleParam(on, 'dosageForm', 'TABLET');
    expect(off.get('dosageForm')).toBeNull();
  });

  it('setParam sets and clears values', () => {
    const sp = setParam(new URLSearchParams(), 'city', 'Dhaka');
    expect(sp.get('city')).toBe('Dhaka');
    const cleared = setParam(sp, 'city', undefined);
    expect(cleared.get('city')).toBeNull();
  });
});

describe('search-constants', () => {
  it('maps home quick filters to API params', () => {
    expect(homeFilterToParams('filterBigDiscount')).toEqual({
      minDiscount: '50',
      sortBy: 'discount',
      sortOrder: 'desc',
    });
    expect(homeFilterToParams('filterShortExpiry')).toEqual({ maxExpiryDays: '30' });
    expect(homeFilterToParams('filterOverstock')).toEqual({ minAvailableQty: '50' });
    expect(homeFilterToParams('filterNearby', { latitude: 23.7, longitude: 90.4 })).toEqual({
      latitude: '23.7',
      longitude: '90.4',
      radiusKm: '2',
    });
  });

  it('defines five home quick filters per PRD', () => {
    expect(HOME_QUICK_FILTERS).toHaveLength(5);
  });
});
