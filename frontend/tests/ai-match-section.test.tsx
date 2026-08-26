import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { AiMatchSection } from '@/components/home/ai-match-section';
import type { Listing } from '@/types';

vi.mock('@/hooks/use-geolocation', () => ({
  useGeolocation: () => ({ coords: null, error: null, requestLocation: vi.fn() }),
}));

const listing = {
  id: 'listing-ai-1',
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
    id: 'pharm-1',
    name: 'My medical',
    city: 'Saktipur',
    rating: 4.8,
    verificationStatus: 'APPROVED',
  },
} as Listing;

vi.mock('@/hooks/use-ai-matches', () => ({
  useAiMatches: () => ({
    data: {
      source: 'rules',
      data: [
        {
          id: 'match-1',
          score: 0.8,
          summary: '25% discount · Healthy expiry window',
          listing,
        },
      ],
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));

describe('AiMatchSection', () => {
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
    expect(card.querySelector('img')).toBeNull();
    expect(card.querySelector('.aspect-square')).toBeNull();
  });
});
