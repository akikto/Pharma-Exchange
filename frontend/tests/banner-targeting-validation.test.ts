import { describe, expect, it } from 'vitest';
import { validateBannerForm } from '@/lib/banner-form';
import i18n from '@/i18n';

const t = i18n.t.bind(i18n);

const baseForm = {
  title: 'Promo',
  subtitle: '',
  mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/demo/o/public%2Fbanners%2Fa.webp?alt=media',
  mediaType: 'IMAGE' as const,
  mediaAlt: '',
  ctaText: '',
  actionType: 'NONE' as const,
  actionTarget: '',
  isActive: true,
  sortOrder: '0',
  bannerType: 'ADMIN' as const,
  targetCountry: '',
  targetState: '',
  targetCity: '',
  targetLatitude: '',
  targetLongitude: '',
  radiusKm: '',
  startsAt: '',
  endsAt: '',
  priority: '0',
};

describe('banner targeting validation', () => {
  it('requires country for country targeting', () => {
    const errors = validateBannerForm({
      ...baseForm,
      targetType: 'COUNTRY',
    }, t);
    expect(errors.targetCountry).toBeTruthy();
  });

  it('requires only radius for radius targeting', () => {
    const errors = validateBannerForm({
      ...baseForm,
      targetType: 'RADIUS',
      radiusKm: '',
    }, t);
    expect(errors.radiusKm).toBeTruthy();
    expect(errors.targetCountry).toBeUndefined();
    expect(errors.targetLatitude).toBeUndefined();
  });

  it('accepts radius values from 1 to 1000 km', () => {
    expect(validateBannerForm({ ...baseForm, targetType: 'RADIUS', radiusKm: '1' }, t).radiusKm).toBeUndefined();
    expect(validateBannerForm({ ...baseForm, targetType: 'RADIUS', radiusKm: '1000' }, t).radiusKm).toBeUndefined();
  });

  it('rejects invalid radius values', () => {
    expect(validateBannerForm({ ...baseForm, targetType: 'RADIUS', radiusKm: '0' }, t).radiusKm).toBeTruthy();
    expect(validateBannerForm({ ...baseForm, targetType: 'RADIUS', radiusKm: '1001' }, t).radiusKm).toBeTruthy();
    expect(validateBannerForm({ ...baseForm, targetType: 'RADIUS', radiusKm: '10.5' }, t).radiusKm).toBeTruthy();
  });
});
