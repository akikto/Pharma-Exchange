import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { HomeAiPickListingCard } from '@/components/home/home-ai-pick-listing-card';
import type { Listing } from '@/types';

const mutate = vi.fn();
const isAddingToCart = vi.fn(() => false);

vi.mock('@/hooks/use-api', () => ({
  useAddToCart: () => ({ mutate, isAddingToCart }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const fixedNow = new Date('2026-08-26T12:00:00Z').getTime();

const baseListing = {
  id: 'listing-ai-1',
  batchNumber: 'B1',
  mfgDate: '2025-01-01',
  expiryDate: '2026-10-15T00:00:00Z',
  sellingPrice: 100,
  discountPercent: 20,
  finalPrice: 80,
  availableQty: 9,
  moq: 1,
  unit: 'strip',
  status: 'ACTIVE',
  distanceKm: 12,
  medicine: {
    id: 'med-1',
    name: 'Nap 10',
    company: 'Acme Pharma',
    dosageForm: 'TABLET',
    strength: '500mg',
    packSize: '10 tablets',
    category: 'Analgesic',
    genericName: 'Naproxen',
  },
  pharmacy: {
    id: 'pharm-1',
    name: 'Toni Pharmacy',
    city: 'Berhampur',
    district: 'Odisha',
    rating: 4.8,
    verificationStatus: 'APPROVED',
    user: { id: 'user-1', phone: '+8801712345678' },
  },
} as Listing;

function renderCard(listing: Listing = baseListing) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={<HomeAiPickListingCard listing={listing} userCoords={{ latitude: 19.3, longitude: 84.8 }} />}
          />
          <Route path="/medicine/:id" element={<div data-testid="medicine-detail-page">Detail</div>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('HomeAiPickListingCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);
    isAddingToCart.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders medicine, seller, stock, and discount information', () => {
    renderCard();

    expect(screen.getByText('Nap 10')).toBeInTheDocument();
    expect(screen.getByText(/Naproxen 500mg/i)).toBeInTheDocument();
    expect(screen.getByText('TABLET')).toBeInTheDocument();
    expect(screen.getByTestId('ai-pick-location-line-listing-ai-1')).toHaveTextContent('Toni Pharmacy');
    expect(screen.getByTestId('ai-pick-location-line-listing-ai-1')).toHaveTextContent(/12 km away/i);
    expect(screen.getByTestId('ai-pick-location-line-listing-ai-1')).toHaveTextContent(/Odisha/i);
    expect(screen.getByLabelText(/Verified/i)).toBeInTheDocument();
    expect(screen.getByTestId('ai-pick-discount-listing-ai-1')).toHaveTextContent('20% OFF');
    expect(screen.getByTestId('ai-pick-stock-listing-ai-1')).toHaveTextContent('9');
    expect(screen.getByText('UNITS')).toBeInTheDocument();
    expect(screen.queryByText('STRIP')).not.toBeInTheDocument();
  });

  it('calculates expiry days from expiry date', () => {
    renderCard();
    const expiry = screen.getByTestId('ai-pick-expiry-listing-ai-1');
    expect(expiry).toHaveTextContent(/Expires in 50 days/i);
    expect(expiry.textContent).toMatch(/Exp:/);
  });

  it('shows verified indicator without authentic footer actions', () => {
    renderCard();
    expect(screen.getByLabelText(/Verified/i)).toBeInTheDocument();
    expect(screen.queryByText('Authentic')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai-pick-watchlist-listing-ai-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai-pick-call-listing-ai-1')).not.toBeInTheDocument();
  });

  it('hides discount badge when discount is zero', () => {
    renderCard({ ...baseListing, discountPercent: 0 });
    expect(screen.queryByTestId('ai-pick-discount-listing-ai-1')).not.toBeInTheDocument();
  });

  it('navigates to medicine detail when the card link is clicked', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('ai-pick-card-link-listing-ai-1'));
    expect(screen.getByTestId('medicine-detail-page')).toBeInTheDocument();
  });

  it('does not navigate when add to cart is clicked', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('ai-pick-add-to-cart-listing-ai-1'));
    expect(mutate).toHaveBeenCalledWith(
      { listingId: 'listing-ai-1', quantity: 1 },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    expect(screen.queryByTestId('medicine-detail-page')).not.toBeInTheDocument();
  });

  it('card link targets listing details route', () => {
    renderCard();
    expect(screen.getByTestId('ai-pick-card-link-listing-ai-1')).toHaveAttribute('href', '/medicine/listing-ai-1');
  });
});
