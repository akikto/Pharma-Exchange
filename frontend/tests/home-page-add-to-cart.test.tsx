import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { HomePage } from '@/features/home/home-page';
import type { Listing } from '@/types';

const useListings = vi.fn();
const useAiMatches = vi.fn();
const useDemoShops = vi.fn();
const mutate = vi.fn();
const isAddingToCart = vi.fn(() => false);
const demoShopState = vi.hoisted(() => ({ activeShopId: null as string | null }));

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
  useAddToCart: () => ({ mutate, isAddingToCart }),
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

vi.mock('@/hooks/use-banners', () => ({
  useHomeBanners: () => ({ data: [], isLoading: false, isError: false }),
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
  useDemoShopStore: (selector?: (state: { activeShopId: string | null }) => unknown) =>
    selector ? selector(demoShopState) : demoShopState,
}));

const baseListing = {
  id: 'listing-1',
  batchNumber: 'B1',
  mfgDate: '2025-01-01',
  expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
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

function featuredResult(listings: Listing[]) {
  return {
    data: { pages: [{ data: listings, pagination: { page: 1, limit: 6, total: listings.length, totalPages: 1 } }] },
    isFetched: true,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isLoading: false,
    isFetchingNextPage: false,
    isFetching: false,
    refetch: vi.fn(),
  };
}

function mainFeedResult(listings: Listing[]) {
  return {
    data: { pages: [{ data: listings, pagination: { page: 1, limit: 20, total: listings.length, totalPages: 1 } }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isLoading: false,
    isFetchingNextPage: false,
    isFetching: false,
    refetch: vi.fn(),
  };
}

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

describe('HomePage add to cart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    demoShopState.activeShopId = null;
    isAddingToCart.mockReturnValue(false);
    useAiMatches.mockReturnValue({ data: { data: [] }, isLoading: false, isFetching: false, refetch: vi.fn() });
    useDemoShops.mockReturnValue({
      data: [{ id: 'pharm-1', name: 'City Pharmacy', city: 'Dhaka', rating: 4.6, verificationStatus: 'APPROVED' }],
    });
  });

  it('shows Add to Cart on Featured Deals, Short Expiry, and All Listings cards', async () => {
    const featuredListing = { ...baseListing, id: 'featured-1', discountPercent: 30 };
    const shortExpiryListing = {
      ...baseListing,
      id: 'short-expiry-1',
      expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const allListingsItem = {
      ...baseListing,
      id: 'all-listings-1',
      expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
    };

    useListings.mockImplementation((params: Record<string, string | undefined>) => {
      if (params.minDiscount === '1' && !params.pharmacyId) {
        return featuredResult([featuredListing]);
      }
      return mainFeedResult([shortExpiryListing, allListingsItem]);
    });

    renderHomePage();

    expect(await screen.findByRole('heading', { name: /Featured Deals|বিশেষ অফার/i })).toBeInTheDocument();
    expect(screen.getByTestId('offer-card-add-to-cart-featured-1')).toBeInTheDocument();
    expect(screen.getAllByTestId('offer-card-add-to-cart-short-expiry-1').length).toBeGreaterThan(0);
    expect(screen.getByTestId('offer-card-add-to-cart-all-listings-1')).toBeInTheDocument();
  });

  it('uses the existing cart hook when Add to Cart is clicked from a home card', async () => {
    const featuredListing = { ...baseListing, id: 'featured-1', discountPercent: 30, moq: 3 };

    useListings.mockImplementation((params: Record<string, string | undefined>) => {
      if (params.minDiscount === '1' && !params.pharmacyId) {
        return featuredResult([featuredListing]);
      }
      return mainFeedResult([]);
    });

    renderHomePage();

    fireEvent.click(await screen.findByTestId('offer-card-add-to-cart-featured-1'));

    expect(mutate).toHaveBeenCalledWith(
      { listingId: 'featured-1', quantity: 3 },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });
});
