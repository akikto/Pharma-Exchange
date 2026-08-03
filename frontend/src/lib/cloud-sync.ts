import type { QueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { QUERY_STALE_TIMES } from '@/lib/query-config';
import { getIsOnline } from '@/lib/online-utils';
import type { BuyRequest, Listing, Notification, Order, PaginatedResponse } from '@/types';

const DEFAULT_LISTING_PARAMS: Record<string, string | number | undefined> = {};

async function fetchListingsPage(
  params: Record<string, string | number | undefined>,
  pageParam = 1,
) {
  const search = new URLSearchParams();
  Object.entries({ ...params, page: pageParam, limit: 20 }).forEach(([k, v]) => {
    if (v !== undefined) search.set(k, String(v));
  });
  return apiClient.get<PaginatedResponse<Listing>>(`/listings/search?${search}`);
}

/**
 * Prefetch marketplace data on startup (adapted cloud sync — REST API, no Firestore).
 * Skips when offline; failures are swallowed so the app still boots with cached data.
 */
export async function prefetchCloudData(
  queryClient: QueryClient,
  options: { isAuthenticated: boolean },
): Promise<void> {
  if (!getIsOnline()) return;

  const tasks: Promise<unknown>[] = [
    queryClient.prefetchInfiniteQuery({
      queryKey: ['listings', DEFAULT_LISTING_PARAMS],
      queryFn: ({ pageParam = 1 }) => fetchListingsPage(DEFAULT_LISTING_PARAMS, pageParam as number),
      initialPageParam: 1,
      getNextPageParam: (last: PaginatedResponse<Listing>) =>
        last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
      staleTime: QUERY_STALE_TIMES.listings,
    }),
  ];

  if (options.isAuthenticated) {
    tasks.push(
      queryClient.prefetchQuery({
        queryKey: ['cart'],
        queryFn: () => apiClient.get('/cart'),
        staleTime: QUERY_STALE_TIMES.cart,
      }),
      queryClient.prefetchQuery({
        queryKey: ['orders', 'buyer', undefined],
        queryFn: () => apiClient.get<PaginatedResponse<Order>>('/orders?role=buyer'),
        staleTime: QUERY_STALE_TIMES.orders,
      }),
      queryClient.prefetchQuery({
        queryKey: ['buy-requests', 'buyer'],
        queryFn: () => apiClient.get<PaginatedResponse<BuyRequest>>('/buy-requests?role=buyer'),
        staleTime: QUERY_STALE_TIMES.buyRequests,
      }),
      queryClient.prefetchQuery({
        queryKey: ['notifications'],
        queryFn: () => apiClient.get<{ data: Notification[]; unreadCount: number }>('/notifications'),
        staleTime: QUERY_STALE_TIMES.notifications,
      }),
    );
  }

  await Promise.allSettled(tasks);
}
