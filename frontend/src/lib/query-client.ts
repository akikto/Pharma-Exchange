import { QueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIMES } from '@/lib/query-config';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIMES.default,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
