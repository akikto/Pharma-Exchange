import { describe, expect, it } from 'vitest';
import { validateBannerForm } from '@/lib/banner-form';
import i18n from '@/i18n';

const t = i18n.t.bind(i18n);

describe('banner targeting validation', () => {
  it('requires country for country targeting', () => {
    const errors = validateBannerForm({
      title: 'Promo',
      subtitle: '',
      mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/demo/o/public%2Fbanners%2Fa.webp?alt=media',
      mediaType: 'IMAGE',
      mediaAlt: '',
      ctaText: '',
      actionType: 'NONE',
      actionTarget: '',
      isActive: true,
      sortOrder: '0',
      bannerType: 'ADMIN',
      targetType: 'COUNTRY',
      targetCountry: '',
      targetState: '',
      targetCity: '',
      targetLatitude: '',
      targetLongitude: '',
      radiusKm: '',
      startsAt: '',
      endsAt: '',
      priority: '0',
    }, t);
    expect(errors.targetCountry).toBeTruthy();
  });
});
