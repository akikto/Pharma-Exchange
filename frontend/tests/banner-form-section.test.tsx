import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BannerFormSection } from '@/components/banner/banner-form-section';

describe('BannerFormSection', () => {
  it('renders click-action and target-audience variants with distinct test ids', () => {
    const { rerender } = render(
      <BannerFormSection variant="click-action" title="Click action" description="Destination hint">
        <p>Action fields</p>
      </BannerFormSection>,
    );

    expect(screen.getByText('Destination')).toBeInTheDocument();
    expect(screen.getByText('Action fields')).toBeInTheDocument();

    rerender(
      <BannerFormSection
        variant="target-audience"
        title="Target audience"
        description="Audience hint"
        testId="banner-target-audience-section"
      >
        <p>Targeting fields</p>
      </BannerFormSection>,
    );

    expect(screen.getByTestId('banner-target-audience-section')).toBeInTheDocument();
    expect(screen.getByText('Audience')).toBeInTheDocument();
    expect(screen.getByText('Targeting fields')).toBeInTheDocument();
  });
});
