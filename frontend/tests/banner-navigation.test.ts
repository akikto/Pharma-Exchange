import { describe, expect, it } from 'vitest';
import { resolveBannerDestination } from '@/lib/banner-navigation';

describe('resolveBannerDestination', () => {
  it('maps action types to real app routes', () => {
    expect(resolveBannerDestination('NONE', null)).toBeNull();
    expect(resolveBannerDestination('INTERNAL_PATH', '/search')).toBe('/search');
    expect(resolveBannerDestination('MEDICINE', 'med-1')).toBe('/medicine/med-1');
    expect(resolveBannerDestination('LISTING', 'listing-1')).toBe('/medicine/listing-1');
    expect(resolveBannerDestination('PHARMACY', 'ph-1')).toBe('/pharmacy/ph-1');
    expect(resolveBannerDestination('CATEGORY', 'Antibiotic')).toBe('/search?category=Antibiotic');
    expect(resolveBannerDestination('EXTERNAL_URL', 'https://example.com')).toBe('https://example.com');
  });
});
