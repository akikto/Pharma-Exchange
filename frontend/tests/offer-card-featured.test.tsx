import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { OfferCard } from '@/components/offers/offer-card';
import type { Listing } from '@/types';

vi.mock('@/hooks/use-api', () => ({
  useAddToCart: () => ({ mutate: vi.fn(), isAddingToCart: () => false }),
}));

vi.mock('@/hooks/use-watchlist', () => ({
  useToggleWatchlist: () => ({ mutate: vi.fn() }),
  useIsWatched: () => false,
}));

vi.mock('@/stores/shell-store', () => ({
  useShellStore: (selector: (state: { openModal: () => void }) => unknown) =>
    selector({ openModal: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const baseListing = {
  id: 'listing-1',
  batchNumber: 'B1',
  mfgDate: '2025-01-01',
  expiryDate: '2026-12-01',
  sellingPrice: 30,
  discountPercent: 20,
  finalPrice: 24,
  availableQty: 10,
  moq: 1,
  unit: 'strip',
  status: 'ACTIVE',
  medicine: {
    id: 'med-1',
    name: 'Ace Plus',
    company: 'Square Pharmaceuticals',
    dosageForm: 'TABLET',
    strength: '500mg+65mg',
    packSize: '10x10 Strip',
    category: 'Analgesic',
    genericName: 'Paracetamol + Caffeine',
  },
  pharmacy: {
    id: 'pharm-1',
    name: 'City Pharmacy',
    city: 'Dhaka',
    rating: 4.6,
    verificationStatus: 'APPROVED',
    latitude: 23.7461,
    longitude: 90.3742,
  },
} as Listing;

function renderFeaturedCard(userCoords?: { latitude: number; longitude: number } | null) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <OfferCard listing={baseListing} variant="featured" userCoords={userCoords} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('OfferCard featured variant', () => {
  it('shows composition fallback from genericName', () => {
    renderFeaturedCard({ latitude: 23.81, longitude: 90.41 });

    expect(screen.getByText(/Paracetamol \+ Caffeine/)).toBeTruthy();
    expect(screen.getByText(/📍/)).toBeTruthy();
    expect(screen.getByText(/কিমি দূরে|km away/)).toBeTruthy();
  });

  it('hides distance when user coordinates are unavailable', () => {
    renderFeaturedCard(null);

    expect(screen.getByText(/Paracetamol \+ Caffeine/)).toBeTruthy();
    expect(screen.queryByText(/কিমি দূরে|km away/)).toBeNull();
  });
});
