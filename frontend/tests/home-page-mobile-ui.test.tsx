import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { HomePage } from '@/features/home/home-page';
import type { Listing } from '@/types';

const useListings = vi.fn();
const useAiMatches = vi.fn();
const useDemoShops = vi.fn();

vi.mock('@/hooks/use-listings', () => ({
  useListings: (...args: unknown[]) => useListings(...args),
}));

vi.mock('@/hooks/use-pharmacy', () => ({
  useDemoShops: (...args: unknown[]) => useDemoShops(...args),
}));

vi.mock('@/hooks/use-ai-matches', () => ({
  useAiMatches: (...args: unknown[]) => useAiMatches(...args),
}));

vi.mock('@/hooks/use-api', () => ({
  useAddToCart: () => ({ mutate: vi.fn(), isAddingToCart: () => false }),
  useCart: () => ({ data: { items: [] } }),
}));

vi.mock('@/hooks/use-geolocation', () => ({
  useGeolocation: () => ({ coords: null, error: null, requestLocation: vi.fn() }),
}));

vi.mock('@/hooks/use-pull-to-refresh', () => ({
  usePullToRefresh: () => ({
    pullDistance: 0,
    isRefreshing: false,
    isTriggered: false,
    runRefresh: vi.fn(),
    handlers: {},
  }),
}));

vi.mock('@/hooks/use-chat', () => ({
  useInfiniteScroll: () => ({ current: null }),
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

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: (state: { isAuthenticated: boolean }) => unknown) => {
    const state = { isAuthenticated: false };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/stores/demo-shop-store', () => ({
  useDemoShopStore: (selector?: (state: { activeShopId: string | null }) => unknown) => {
    const state = { activeShopId: null };
    return selector ? selector(state) : state;
  },
}));

const baseListing = {
  id: 'listing-1',
  batchNumber: 'B1',
  mfgDate: '2025-01-01',
  expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
  sellingPrice: 100,
  discountPercent: 20,
  finalPrice: 80,
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
} as Listing;

function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('HomePage mobile UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAiMatches.mockReturnValue({ data: { data: [] }, isLoading: false, isFetching: false, refetch: vi.fn() });
    useDemoShops.mockReturnValue({
      data: [{ id: 'pharm-1', name: 'City Pharmacy', city: 'Dhaka', rating: 4.6, verificationStatus: 'APPROVED' }],
    });
  });

  it('renders Short Expiry Deals in a fixed grid instead of a horizontal carousel', async () => {
    const shortExpiryListings = [
      { ...baseListing, id: 'short-1' },
      { ...baseListing, id: 'short-2' },
      { ...baseListing, id: 'short-3' },
    ];

    useListings.mockImplementation((params: Record<string, string | undefined>) => {
      if (params.minDiscount === '1' && !params.pharmacyId) {
        return {
          data: { pages: [{ data: [], pagination: { page: 1, limit: 6, total: 0, totalPages: 0 } }] },
          isFetched: true,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isLoading: false,
          isFetchingNextPage: false,
          isFetching: false,
          refetch: vi.fn(),
        };
      }
      return {
        data: { pages: [{ data: shortExpiryListings, pagination: { page: 1, limit: 20, total: 3, totalPages: 1 } }] },
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isLoading: false,
        isFetchingNextPage: false,
        isFetching: false,
        refetch: vi.fn(),
      };
    });

    renderHomePage();

    const grid = await screen.findByTestId('home-short-expiry-grid');
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('grid-cols-2');
    expect(grid.className).not.toContain('overflow-x-auto');
    expect(grid.querySelectorAll('[data-testid^="offer-card-add-to-cart-short-"]')).toHaveLength(3);
  });

  it('keeps Featured Deals in a horizontal carousel', async () => {
    const featuredListing = { ...baseListing, id: 'featured-1', discountPercent: 30 };

    useListings.mockImplementation((params: Record<string, string | undefined>) => {
      if (params.minDiscount === '1' && !params.pharmacyId) {
        return {
          data: { pages: [{ data: [featuredListing], pagination: { page: 1, limit: 6, total: 1, totalPages: 1 } }] },
          isFetched: true,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isLoading: false,
          isFetchingNextPage: false,
          isFetching: false,
          refetch: vi.fn(),
        };
      }
      return {
        data: { pages: [{ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }] },
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isLoading: false,
        isFetchingNextPage: false,
        isFetching: false,
        refetch: vi.fn(),
      };
    });

    renderHomePage();

    expect(await screen.findByRole('heading', { name: /Featured Deals|বিশেষ অফার/i })).toBeInTheDocument();
    const featuredSection = screen.getByRole('heading', { name: /Featured Deals|বিশেষ অফার/i }).closest('section');
    const carousel = featuredSection?.querySelector('.overflow-x-auto');
    expect(carousel).toBeTruthy();
  });

  it('uses neutral styling for the home search input', async () => {
    useListings.mockReturnValue({
      data: { pages: [{ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isLoading: false,
      isFetchingNextPage: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderHomePage();

    const input = await screen.findByLabelText(/search|খুঁজুন/i);
    expect(input.className).toContain('bg-surface-raised');
    expect(input.className).not.toContain('bg-primary-subtle');
  });
});
