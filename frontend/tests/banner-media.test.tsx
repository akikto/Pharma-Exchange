import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { BannerMedia } from '@/components/banner/banner-media';

describe('BannerMedia video sound', () => {
  beforeEach(() => {
    void i18n.changeLanguage('en');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts muted for autoplay and unmutes after user taps the sound control', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BannerMedia
          mediaUrl="https://example.com/promo.mp4"
          mediaType="VIDEO"
          alt="Promo video"
          isActive
          showSoundToggle
        />
      </I18nextProvider>,
    );

    const video = screen.getByTestId('banner-media-video') as HTMLVideoElement;
    expect(video.muted).toBe(true);

    fireEvent.click(screen.getByTestId('banner-media-sound-toggle'));
    expect(video.muted).toBe(false);

    fireEvent.click(screen.getByTestId('banner-media-sound-toggle'));
    expect(video.muted).toBe(true);
  });

  it('does not render a sound toggle for non-carousel video previews', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BannerMedia
          mediaUrl="https://example.com/promo.mp4"
          mediaType="VIDEO"
          alt="Promo video"
          isActive
        />
      </I18nextProvider>,
    );

    expect(screen.queryByTestId('banner-media-sound-toggle')).not.toBeInTheDocument();
  });
});
