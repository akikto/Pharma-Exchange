import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { MedicineDetailPage } from '@/features/medicine/medicine-detail-page';
import type { Listing } from '@/types';

const listing = vi.hoisted(() => ({
  id: 'listing-1',
  batchNumber: 'B1',
  mfgDate: '2025-01-01',
  expiryDate: '2026-12-01',
  sellingPrice: 100,
  discountPercent: 10,
  finalPrice: 90,
  availableQty: 10,
  moq: 1,
  unit: 'strip',
  status: 'ACTIVE',
  medicine: {
    id: 'med-1',
    name: 'Napa',
    company: 'Beximco',
    dosageForm: 'TABLET',
    packSize: '10 tablets',
    category: 'Analgesic',
  },
  pharmacy: {
    id: 'pharm-1',
    name: 'City Pharmacy',
    city: 'Dhaka',
    rating: 4.6,
    verificationStatus: 'APPROVED',
  },
} as Listing));

vi.mock('@/hooks/use-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-api')>();
  return {
    ...actual,
    useAddToCart: () => ({ mutate: vi.fn(), isAddingToCart: () => false }),
    useCart: () => ({ data: { items: [] } }),
  };
});

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(() => Promise.resolve(listing)),
  },
}));

vi.mock('@/hooks/use-watchlist', () => ({
  useToggleWatchlist: () => ({ mutate: vi.fn() }),
  useIsWatched: () => false,
  useWatchlistCount: () => 0,
}));

vi.mock('@/stores/shell-store', () => ({
  useShellStore: (selector: (state: { openModal: () => void }) => unknown) =>
    selector({ openModal: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderDetailPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/medicine/listing-1']}>
          <Routes>
            <Route path="/medicine/:id" element={<MedicineDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('MedicineDetailPage mobile action bar', () => {
  it('renders quantity, Buy Now, and Add to Cart controls in a grid layout', async () => {
    renderDetailPage();

    expect(await screen.findByRole('button', { name: /Buy Now|এখনই কিনুন/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add to Cart|কার্টে যোগ/i })).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    const buyNow = screen.getByRole('button', { name: /Buy Now|এখনই কিনুন/i });
    const actionBar = buyNow.parentElement;
    expect(actionBar?.className).toContain('grid');
    expect(actionBar?.className).toContain('grid-cols-');
  });
});
