import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BannerFrame } from '@/components/banner/banner-frame';

describe('BannerFrame', () => {
  it('keeps a 2:1 aspect ratio container', () => {
    render(
      <BannerFrame testId="banner-frame">
        <div data-testid="child">Media</div>
      </BannerFrame>,
    );

    const frame = screen.getByTestId('banner-frame');
    const aspect = frame.querySelector('.aspect-\\[2\\/1\\]');
    expect(aspect).toBeTruthy();
  });
});
