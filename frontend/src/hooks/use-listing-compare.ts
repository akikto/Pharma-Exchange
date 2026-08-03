import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Listing, Medicine } from '@/types';
import type { CompareSort } from '@/lib/offer-utils';

export interface CompareStats {
  sellerCount: number;
  lowestPrice: number;
  highestPrice: number;
}

export interface CompareResponse {
  medicine: Medicine;
  listings: Listing[];
  stats: CompareStats;
}

export function useListingCompare(medicineId?: string, sortBy: CompareSort = 'price', coords?: { latitude: number; longitude: number } | null) {
  return useQuery({
    queryKey: ['listings-compare', medicineId, sortBy, coords?.latitude, coords?.longitude],
    queryFn: () => {
      const params = new URLSearchParams({ medicineId: medicineId!, sortBy });
      if (coords) {
        params.set('latitude', String(coords.latitude));
        params.set('longitude', String(coords.longitude));
      }
      return apiClient.get<CompareResponse>(`/listings/compare?${params}`);
    },
    enabled: Boolean(medicineId),
  });
}
