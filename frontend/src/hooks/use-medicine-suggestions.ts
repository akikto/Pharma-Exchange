import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Medicine, PaginatedResponse } from '@/types';
import { useDebouncedValue } from './use-debounced-value';

export function useMedicineSuggestions(query: string, enabled = true) {
  const debounced = useDebouncedValue(query.trim(), 300);
  const shouldFetch = enabled && debounced.length >= 2;

  return useQuery({
    queryKey: ['medicine-suggestions', debounced],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Medicine>>(`/medicines?q=${encodeURIComponent(debounced)}&limit=8`),
    enabled: shouldFetch,
    staleTime: 60_000,
  });
}

export function useMedicineAlternatives(medicineId?: string) {
  return useQuery({
    queryKey: ['medicine-alternatives', medicineId],
    queryFn: () =>
      apiClient.get<{ data: Medicine[]; total: number }>(`/medicines/${medicineId}/alternatives`),
    enabled: Boolean(medicineId),
    staleTime: 120_000,
  });
}
