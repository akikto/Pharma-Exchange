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
  expiryDate: '2026-12-01',
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

describe('HomePage featured deals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    demoShopState.activeShopId = null;
    useAiMatches.mockReturnValue({ data: { data: [] }, isLoading: false, isFetching: false, refetch: vi.fn() });
    useDemoShops.mockReturnValue({ data: [{ id: 'pharm-1', name: 'City Pharmacy', city: 'Dhaka', rating: 4.6, verificationStatus: 'APPROVED' }] });
  });

  it('keeps Featured Deals visible when All Listings is empty', async () => {
    const featuredListing = { ...baseListing, id: 'featured-1', discountPercent: 30 };

    useListings.mockImplementation((params: Record<string, string | undefined>) => {
      if (params.minDiscount === '1') {
        return {
          data: { pages: [{ data: [featuredListing], pagination: { page: 1, limit: 6, total: 1, totalPages: 1 } }] },
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
    expect(screen.getByText('Napa')).toBeInTheDocument();
    expect(screen.getByText(/All Listings|সব লিস্টিং/i)).toBeInTheDocument();
    expect(screen.getByText(/No listings found|কোনো তালিকা পাওয়া যায়নি/i)).toBeInTheDocument();
  });

  it('keeps Featured Deals visible when activeShopId is stale and not a demo shop', async () => {
    demoShopState.activeShopId = 'stale-shop-id';
    const featuredListing = { ...baseListing, id: 'featured-1', discountPercent: 30 };

    useListings.mockImplementation((params: Record<string, string | undefined>) => {
      if (params.minDiscount === '1' && !params.pharmacyId) {
        return {
          data: { pages: [{ data: [featuredListing], pagination: { page: 1, limit: 6, total: 1, totalPages: 1 } }] },
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
    expect(screen.getByText('Napa')).toBeInTheDocument();

    const featuredCall = useListings.mock.calls.find(
      ([params]) => (params as Record<string, string>).minDiscount === '1',
    );
    expect(featuredCall?.[0]).toEqual(expect.objectContaining({ minDiscount: '1' }));
    expect(featuredCall?.[0]).not.toHaveProperty('pharmacyId');
  });
});
