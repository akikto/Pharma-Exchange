import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { QUERY_STALE_TIMES } from '@/lib/query-config';
import type { Listing, PaginatedResponse } from '@/types';

export function useListings(
  params: Record<string, string | number | undefined> = {},
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: ['listings', params],
    queryFn: ({ pageParam = 1 }) => {
      const search = new URLSearchParams();
      Object.entries({ ...params, page: pageParam, limit: 20 }).forEach(([k, v]) => {
        if (v !== undefined) search.set(k, String(v));
      });
      return apiClient.get<PaginatedResponse<Listing>>(`/listings/search?${search}`);
    },
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: QUERY_STALE_TIMES.listings,
    enabled: options?.enabled ?? true,
  });
}
