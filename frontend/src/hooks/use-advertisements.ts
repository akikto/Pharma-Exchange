import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { AdminHomeBanner, BannerFormValues } from '@/lib/banner-form';
import { formToSellerAdvertisementPayload } from '@/lib/banner-form';
import { adminBannersQueryKey, homeBannersQueryKey } from '@/hooks/use-banners';

export const sellerAdvertisementsQueryKey = ['seller', 'advertisements'] as const;

export function useSellerAdvertisements() {
  return useQuery({
    queryKey: sellerAdvertisementsQueryKey,
    queryFn: () => apiClient.get<{ data: AdminHomeBanner[] }>('/advertisements/my').then((r) => r.data),
  });
}

export function useSellerAdvertisement(id?: string) {
  return useQuery({
    queryKey: [...sellerAdvertisementsQueryKey, id],
    queryFn: () => apiClient.get<AdminHomeBanner>(`/advertisements/my/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSellerAdvertisement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: BannerFormValues) =>
      apiClient.post<AdminHomeBanner>('/advertisements', formToSellerAdvertisementPayload(values)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sellerAdvertisementsQueryKey });
      void qc.invalidateQueries({ queryKey: adminBannersQueryKey });
    },
  });
}

export function useUpdateSellerAdvertisement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BannerFormValues }) =>
      apiClient.patch<AdminHomeBanner>(`/advertisements/my/${id}`, formToSellerAdvertisementPayload(values)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sellerAdvertisementsQueryKey });
      void qc.invalidateQueries({ queryKey: adminBannersQueryKey });
    },
  });
}

export function useCancelSellerAdvertisement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/advertisements/my/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sellerAdvertisementsQueryKey });
      void qc.invalidateQueries({ queryKey: adminBannersQueryKey });
      void qc.invalidateQueries({ queryKey: homeBannersQueryKey });
    },
  });
}
