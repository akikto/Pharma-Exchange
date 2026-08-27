import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { ListingDetailInsights } from '@/components/listing/listing-detail-insights';
import type { Listing } from '@/types';

const fixedNow = new Date('2026-08-26T12:00:00Z').getTime();

const baseListing = {
  id: 'listing-1',
  batchNumber: 'B1',
  mfgDate: '2025-01-01',
  expiryDate: '2026-10-15T00:00:00Z',
  sellingPrice: 100,
  discountPercent: 0,
  finalPrice: 100,
  availableQty: 5,
  moq: 1,
  unit: 'strip',
  status: 'ACTIVE',
  distanceKm: 8.5,
  deliveryMode: 'SELLER_DELIVERS',
  estimatedDeliveryDays: 3,
  medicine: {
    id: 'med-1',
    name: 'Nap 10',
    company: 'Acme',
    dosageForm: 'TABLET',
    strength: '500mg',
    packSize: '10',
    category: 'Pain',
    genericName: 'Naproxen',
    indications: 'Fever and pain relief',
    dosageInstructions: 'Take after food',
    sideEffects: 'May cause drowsiness',
  },
  pharmacy: {
    id: 'ph-1',
    name: 'City Pharma',
    city: 'Dhaka',
    rating: 4.5,
    verificationStatus: 'APPROVED',
    latitude: 23.8,
    longitude: 90.4,
  },
} as Listing;

function renderInsights(listing: Listing = baseListing) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ListingDetailInsights listing={listing} userCoords={{ latitude: 23.75, longitude: 90.39 }} />
    </I18nextProvider>,
  );
}

describe('ListingDetailInsights', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows trust badges, expiry, distance, delivery mode, and clinical info', () => {
    renderInsights();

    expect(screen.getByText('Authentic')).toBeInTheDocument();
    expect(screen.getByText('Fast Delivery')).toBeInTheDocument();
    expect(screen.getByText(/Expires in 50 days/i)).toBeInTheDocument();
    expect(screen.getByText(/km from you/i)).toBeInTheDocument();
    expect(screen.getByText(/Seller delivers to the buyer/i)).toBeInTheDocument();
    expect(screen.getByText(/Delivery in about 3 days/i)).toBeInTheDocument();
    expect(screen.getByText('Fever and pain relief')).toBeInTheDocument();
    expect(screen.getByText('Take after food')).toBeInTheDocument();
    expect(screen.getByText('May cause drowsiness')).toBeInTheDocument();
  });

  it('shows buyer pickup copy when delivery mode is BUYER_PICKUP', () => {
    renderInsights({ ...baseListing, deliveryMode: 'BUYER_PICKUP', estimatedDeliveryDays: null });
    expect(screen.getByText(/Buyer picks up from the seller/i)).toBeInTheDocument();
  });
});
