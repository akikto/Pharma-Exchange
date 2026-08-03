import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Pharmacy, PharmacyProfile } from '@/types';

export function usePharmacyProfile(id?: string) {
  return useQuery({
    queryKey: ['pharmacy', id],
    queryFn: () => apiClient.get<PharmacyProfile>(`/pharmacies/${id}`),
    enabled: !!id,
  });
}

export function useDemoShops() {
  return useQuery({
    queryKey: ['pharmacy', 'demo-shops'],
    queryFn: () => apiClient.get<Pharmacy[]>('/pharmacies/demo-shops'),
  });
}
