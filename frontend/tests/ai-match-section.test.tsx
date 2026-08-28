import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { AiMatchSection } from '@/components/home/ai-match-section';
import type { Listing } from '@/types';

const makeAiPickListing = vi.hoisted(
  () =>
    (id: string, lat?: number, lng?: number, distanceKm?: number): Listing =>
      ({
      id,
      batchNumber: 'B1',
      mfgDate: '2025-01-01',
      expiryDate: '2026-10-15T00:00:00Z',
      sellingPrice: 100,
      discountPercent: 25,
      finalPrice: 75,
      availableQty: 9,
      moq: 1,
      unit: 'strip',
  status: 'ACTIVE',
  distanceKm,
  medicine: {
        id: 'med-1',
        name: 'Xone',
        company: 'Alkem',
        dosageForm: 'TABLET',
        strength: '1g',
        packSize: '1',
        category: 'Antibiotic',
        genericName: 'Ceftriaxone',
      },
      pharmacy: {
        id: `pharm-${id}`,
        name: 'My medical',
        city: 'Saktipur',
        rating: 4.8,
        verificationStatus: 'APPROVED',
        ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
      },
    }) as Listing,
);

const aiPickListing = makeAiPickListing('listing-ai-1', undefined, undefined, 12);

const mockUseGeolocation = vi.hoisted(() =>
  vi.fn(() => ({ coords: null as { latitude: number; longitude: number } | null, error: null, requestLocation: vi.fn() })),
);

const mockUseAiMatches = vi.hoisted(() =>
  vi.fn(() => ({
    data: {
      source: 'rules',
      data: [
        {
          id: 'match-1',
          score: 0.8,
          summary: '25% discount · Healthy expiry window',
          listing: aiPickListing,
        },
      ],
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  })),
);

vi.mock('@/hooks/use-geolocation', () => ({
  useGeolocation: () => mockUseGeolocation(),
}));

vi.mock('@/hooks/use-api', () => ({
  useAddToCart: () => ({ mutate: vi.fn(), isAddingToCart: () => false }),
}));

vi.mock('@/hooks/use-watchlist', () => ({
  useToggleWatchlist: () => ({ mutate: vi.fn() }),
  useIsWatched: () => false,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/use-ai-matches', () => ({
  useAiMatches: () => mockUseAiMatches(),
}));

describe('AiMatchSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGeolocation.mockReturnValue({
      coords: null,
      error: null,
      requestLocation: vi.fn(),
    });
    mockUseAiMatches.mockReturnValue({
      data: {
        source: 'rules',
        data: [
          {
            id: 'match-1',
            score: 0.8,
            summary: '25% discount · Healthy expiry window',
            listing: aiPickListing,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
  });

  it('renders horizontal AI pick cards without listing image blocks', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AiMatchSection />
        </MemoryRouter>
      </I18nextProvider>,
    );

    const card = screen.getByTestId('ai-pick-listing-card-listing-ai-1');
    expect(card).toHaveAttribute('data-ai-pick-layout', 'horizontal');
    expect(screen.getByTestId('ai-pick-discount-listing-ai-1')).toHaveTextContent('25% OFF');
    expect(screen.getByTestId('ai-pick-add-to-cart-listing-ai-1')).toBeInTheDocument();
    expect(screen.queryByTestId('offer-card-listing-ai-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('listing-card-listing-ai-1')).not.toBeInTheDocument();
    expect(screen.queryByText(/Healthy expiry window/i)).not.toBeInTheDocument();
    expect(screen.queryByText('80%')).not.toBeInTheDocument();
    expect(card.querySelector('img')).toBeNull();
    expect(card.querySelector('.aspect-square')).toBeNull();
  });

  it('orders AI picks nearest-first when user location is available', () => {
    mockUseGeolocation.mockReturnValue({
      coords: { latitude: 23.8, longitude: 90.4 },
      error: null,
      requestLocation: vi.fn(),
    });
    mockUseAiMatches.mockReturnValue({
      data: {
        source: 'rules',
        data: [
          { id: 'match-far', score: 0.9, summary: '', listing: makeAiPickListing('listing-far', 24.5, 91.0) },
          { id: 'match-near', score: 0.7, summary: '', listing: makeAiPickListing('listing-near', 23.81, 90.41) },
          { id: 'match-mid', score: 0.8, summary: '', listing: makeAiPickListing('listing-mid', 24.0, 90.6) },
        ],
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AiMatchSection />
        </MemoryRouter>
      </I18nextProvider>,
    );

    const cards = screen.getAllByTestId(/^ai-pick-listing-card-/);
    expect(cards.map((card) => card.getAttribute('data-testid'))).toEqual([
      'ai-pick-listing-card-listing-near',
      'ai-pick-listing-card-listing-mid',
      'ai-pick-listing-card-listing-far',
    ]);
  });
});
