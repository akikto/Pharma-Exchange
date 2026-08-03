import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useWatchlistStore } from '@/stores/watchlist-store';
import type { Medicine } from '@/types';
import type { PriceTrend } from '@/lib/watchlist-utils';

export interface WatchlistEntry {
  id: string;
  medicineId: string;
  medicine: Medicine;
  bestPrice: number | null;
  sellerCount: number;
  bestListingId: string | null;
  priceTrend: PriceTrend;
  createdAt: string;
}

export interface PriceAlertEntry {
  id: string;
  medicineId: string;
  maxPrice: string | number;
  isEnabled: boolean;
  medicine: Pick<Medicine, 'id' | 'name' | 'company' | 'genericName'>;
}

export interface TriggeredAlertEntry {
  id: string;
  medicineId: string;
  listingId: string | null;
  listingPrice: string | number;
  maxPrice: string | number;
  isSimulated: boolean;
  medicine: Pick<Medicine, 'id' | 'name' | 'company'>;
  listing?: {
    id: string;
    finalPrice: string | number;
    availableQty: number;
    moq: number;
    pharmacy: { id: string; name: string };
  } | null;
}

export function useWatchlist(options?: { enabled?: boolean }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: () => apiClient.get<{ data: WatchlistEntry[] }>('/watchlist'),
    enabled: (options?.enabled ?? true) && isAuthenticated,
  });
}

export function useWatchlistIds() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['watchlist-ids'],
    queryFn: () => apiClient.get<{ medicineIds: string[] }>('/watchlist/ids'),
    enabled: isAuthenticated,
  });
}

export function useToggleWatchlist() {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { toggle: localToggle, has: localHas } = useWatchlistStore();

  return useMutation({
    mutationFn: async (medicineId: string) => {
      if (!isAuthenticated) {
        const wasWatched = localHas(medicineId);
        localToggle(medicineId);
        return { added: !wasWatched };
      }

      const { medicineIds } = await apiClient.get<{ medicineIds: string[] }>('/watchlist/ids');
      const watched = medicineIds.includes(medicineId);

      if (watched) {
        await apiClient.delete(`/watchlist/${medicineId}`);
        if (localHas(medicineId)) localToggle(medicineId);
        return { added: false };
      }

      await apiClient.post('/watchlist', { medicineId });
      if (!localHas(medicineId)) localToggle(medicineId);
      return { added: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] });
      qc.invalidateQueries({ queryKey: ['watchlist-ids'] });
    },
  });
}

export function useIsWatched(medicineId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const localHas = useWatchlistStore((s) => s.has(medicineId));
  const { data } = useWatchlistIds();
  if (!isAuthenticated) return localHas;
  if (data) return data.medicineIds.includes(medicineId);
  return localHas;
}

export function useWatchlistCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const localCount = useWatchlistStore((s) => s.medicineIds.length);
  const { data } = useWatchlistIds();
  if (!isAuthenticated) return localCount;
  return data?.medicineIds.length ?? localCount;
}

export function usePriceAlerts() {
  return useQuery({
    queryKey: ['price-alerts'],
    queryFn: () => apiClient.get<{ data: PriceAlertEntry[] }>('/price-alerts'),
  });
}

export function useUpsertPriceAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { medicineId: string; maxPrice: number }) =>
      apiClient.post<PriceAlertEntry>('/price-alerts', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['price-alerts'] }),
  });
}

export function useUpdatePriceAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; maxPrice?: number; isEnabled?: boolean }) =>
      apiClient.patch<PriceAlertEntry>(`/price-alerts/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['price-alerts'] }),
  });
}

export function useTriggeredAlerts() {
  return useQuery({
    queryKey: ['triggered-alerts'],
    queryFn: () => apiClient.get<{ data: TriggeredAlertEntry[] }>('/price-alerts/triggered'),
  });
}

export function useDismissTriggeredAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/price-alerts/triggered/${id}/dismiss`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['triggered-alerts'] }),
  });
}

export function useSimulatePriceAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { medicineId: string; listingPrice: number }) =>
      apiClient.post('/price-alerts/triggered/simulate', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['triggered-alerts'] }),
  });
}
