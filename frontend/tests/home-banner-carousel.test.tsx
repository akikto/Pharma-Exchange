import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { HomeBannerCarousel } from '@/components/home/home-banner-carousel';

const useHomeBanners = vi.fn();

vi.mock('@/hooks/use-banners', () => ({
  useHomeBanners: () => useHomeBanners(),
}));

function renderCarousel() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <HomeBannerCarousel />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('HomeBannerCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when there are no active banners', () => {
    useHomeBanners.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderCarousel();
    expect(screen.queryByTestId('home-banner-carousel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-banner-carousel-loading')).not.toBeInTheDocument();
  });

  it('renders carousel when banners exist', () => {
    useHomeBanners.mockReturnValue({
      data: [
        {
          id: 'b1',
          title: 'Summer Sale',
          subtitle: null,
          mediaUrl: 'https://example.com/b.jpg',
          mediaType: 'IMAGE',
          mediaAlt: null,
          ctaText: null,
          actionType: 'NONE',
          actionTarget: null,
        },
      ],
      isLoading: false,
      isError: false,
    });
    renderCarousel();
    expect(screen.getByTestId('home-banner-carousel')).toBeInTheDocument();
    expect(screen.getByTestId('home-banner-slide-b1')).toBeInTheDocument();
  });

  it('shows sound toggle for video banners', () => {
    useHomeBanners.mockReturnValue({
      data: [
        {
          id: 'video-1',
          title: 'Video Promo',
          subtitle: null,
          mediaUrl: 'https://example.com/promo.mp4',
          mediaType: 'VIDEO',
          mediaAlt: null,
          ctaText: null,
          actionType: 'NONE',
          actionTarget: null,
        },
      ],
      isLoading: false,
      isError: false,
    });
    renderCarousel();
    expect(screen.getByTestId('banner-media-sound-toggle')).toBeInTheDocument();
  });
});
