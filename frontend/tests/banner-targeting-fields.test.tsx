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

  it('shows radius fields for radius targeting', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BannerTargetingFields
          form={{ ...EMPTY_BANNER_FORM, targetType: 'RADIUS' }}
          errors={{}}
          t={i18n.t.bind(i18n)}
          onChange={() => {}}
        />
      </I18nextProvider>,
    );

    expect(screen.getByTestId('banner-target-latitude')).toBeInTheDocument();
    expect(screen.getByTestId('banner-radius-km')).toBeInTheDocument();
  });
});
