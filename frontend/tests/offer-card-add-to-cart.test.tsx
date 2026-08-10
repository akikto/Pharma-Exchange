import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { OfferCard } from '@/components/offers/offer-card';
import type { Listing } from '@/types';

const mutate = vi.fn();
const isAddingToCart = vi.fn(() => false);

vi.mock('@/hooks/use-api', () => ({
  useAddToCart: () => ({ mutate, isAddingToCart }),
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
  moq: 2,
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

function renderOfferCard(variant: 'grid' | 'featured', showAddToCart = true) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <OfferCard listing={baseListing} variant={variant} showAddToCart={showAddToCart} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('OfferCard add to cart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAddingToCart.mockReturnValue(false);
  });

  it.each([
    ['featured', 'featured'],
    ['grid', 'grid'],
  ] as const)('shows Add to Cart on %s variant when showAddToCart is enabled', (variant) => {
    renderOfferCard(variant);

    expect(screen.getByTestId('offer-card-add-to-cart-listing-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add to Cart|কার্টে যোগ/i })).toBeInTheDocument();
  });

  it('sends listing id and MOQ to the existing cart hook', () => {
    renderOfferCard('grid');

    fireEvent.click(screen.getByTestId('offer-card-add-to-cart-listing-1'));

    expect(mutate).toHaveBeenCalledWith(
      { listingId: 'listing-1', quantity: 2 },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it('disables Add to Cart while the request is pending', () => {
    isAddingToCart.mockReturnValue(true);
    renderOfferCard('grid');

    expect(screen.getByTestId('offer-card-add-to-cart-listing-1')).toBeDisabled();
  });

  it('disables Add to Cart when stock is below MOQ', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <OfferCard
            listing={{ ...baseListing, availableQty: 1, moq: 2 }}
            variant="grid"
            showAddToCart
          />
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(screen.getByTestId('offer-card-add-to-cart-listing-1')).toBeDisabled();
  });

  it('hides compact Add to Cart when showAddToCart is false', () => {
    renderOfferCard('grid', false);

    expect(screen.queryByTestId('offer-card-add-to-cart-listing-1')).not.toBeInTheDocument();
  });
});
