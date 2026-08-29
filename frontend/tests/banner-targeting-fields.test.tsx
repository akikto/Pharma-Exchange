import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { BannerTargetingFields } from '@/components/banner/banner-targeting-fields';
import { EMPTY_BANNER_FORM } from '@/lib/banner-form';

describe('BannerTargetingFields', () => {
  it('shows progressive location fields for city targeting', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BannerTargetingFields
          form={{ ...EMPTY_BANNER_FORM, targetType: 'CITY' }}
          errors={{}}
          t={i18n.t.bind(i18n)}
          onChange={() => {}}
        />
      </I18nextProvider>,
    );

    expect(screen.getByTestId('banner-target-country')).toBeInTheDocument();
    expect(screen.getByTestId('banner-target-state')).toBeInTheDocument();
    expect(screen.getByTestId('banner-target-city')).toBeInTheDocument();
    expect(screen.queryByTestId('banner-radius-km')).not.toBeInTheDocument();
  });

  it('shows only radius controls for radius targeting', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BannerTargetingFields
          form={{ ...EMPTY_BANNER_FORM, targetType: 'RADIUS', radiusKm: '10' }}
          errors={{}}
          t={i18n.t.bind(i18n)}
          onChange={() => {}}
          radiusCenterHint="Radius is centered on your verified shop location (City Pharmacy)."
        />
      </I18nextProvider>,
    );

    expect(screen.getByTestId('banner-radius-km')).toBeInTheDocument();
    expect(screen.getByTestId('banner-radius-center-hint')).toBeInTheDocument();
    expect(screen.queryByTestId('banner-target-country')).not.toBeInTheDocument();
    expect(screen.queryByTestId('banner-target-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('banner-target-city')).not.toBeInTheDocument();
    expect(screen.queryByTestId('banner-target-latitude')).not.toBeInTheDocument();
    expect(screen.queryByTestId('banner-target-longitude')).not.toBeInTheDocument();
  });
});
