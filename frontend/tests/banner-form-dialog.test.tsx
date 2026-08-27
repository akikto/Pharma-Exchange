import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { BannerFormDialog } from '@/features/admin/components/banner-form-dialog';

const pharmacyList = vi.fn();
const listingsPages = vi.fn();

vi.mock('@/hooks/use-listings', () => ({
  useListings: (_params: unknown, options?: { enabled?: boolean }) => {
    if (options?.enabled === false) return { data: undefined };
    return listingsPages();
  },
}));

vi.mock('@/hooks/use-banner-media-upload', () => ({
  useBannerMediaUpload: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/use-admin-medicines', () => ({
  useAdminMedicines: () => ({ data: { data: [] } }),
}));

vi.mock('@/hooks/use-admin-sellers', () => ({
  useAdminSellers: () => pharmacyList(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderDialog() {
  void i18n.changeLanguage('en');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <BannerFormDialog
          open
          mode="create"
          onOpenChange={vi.fn()}
          onSubmit={vi.fn().mockResolvedValue(undefined)}
        />
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('BannerFormDialog pharmacy target', () => {
  beforeEach(() => {
    listingsPages.mockReturnValue({
      data: {
        pages: [
          {
            data: [
              {
                id: 'listing-abc',
                batchNumber: 'FR12',
                availableQty: 10,
                medicine: { name: 'Ace Plus' },
              },
            ],
            pagination: { page: 1, totalPages: 1, total: 1, limit: 50 },
          },
        ],
        pageParams: [1],
      },
    });
    pharmacyList.mockReturnValue({
      data: {
        data: [
          {
            id: 'pharm-550e8400-e29b-41d4-a716-446655440099',
            name: 'Toni Pharmacy',
            city: 'Berhampur',
            licenseNumber: 'L-1',
            verificationStatus: 'APPROVED',
            isActive: true,
            listingCount: 3,
            owner: null,
          },
        ],
        pagination: { total: 1, page: 1, limit: 50 },
      },
    });
  });

  it('shows pharmacy search and select when action type is Shop (pharmacy)', async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText(/click action/i), { target: { value: 'PHARMACY' } });

    await waitFor(() => {
      expect(screen.getByTestId('banner-pharmacy-select')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('banner-pharmacy-search'), { target: { value: 'Toni' } });

    const select = screen.getByTestId('banner-pharmacy-select');
    expect(select).toHaveTextContent('Toni Pharmacy');
    fireEvent.change(select, { target: { value: 'pharm-550e8400-e29b-41d4-a716-446655440099' } });
    expect(select).toHaveValue('pharm-550e8400-e29b-41d4-a716-446655440099');
  });

  it('shows shop then item selects when action type is Shop item (listing)', async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText(/click action/i), { target: { value: 'LISTING' } });

    await waitFor(() => {
      expect(screen.getByTestId('banner-listing-shop-select')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('banner-listing-shop-select'), {
      target: { value: 'pharm-550e8400-e29b-41d4-a716-446655440099' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('banner-listing-item-select')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('banner-listing-item-select'), { target: { value: 'listing-abc' } });
    expect(screen.getByTestId('banner-listing-item-select')).toHaveValue('listing-abc');
  });
});
