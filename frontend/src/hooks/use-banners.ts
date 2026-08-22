import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { AdminHomeBanner, BannerFormValues, HomeBanner } from '@/lib/banner-form';
import { formToCreatePayload, formToUpdatePayload } from '@/lib/banner-form';

export const homeBannersQueryKey = ['banners', 'active'] as const;
export const adminBannersQueryKey = ['admin', 'banners'] as const;

export function useHomeBanners() {
  return useQuery({
    queryKey: homeBannersQueryKey,
    queryFn: () => apiClient.get<{ data: HomeBanner[] }>('/banners').then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useAdminBanners() {
  return useQuery({
    queryKey: adminBannersQueryKey,
    queryFn: () => apiClient.get<{ data: AdminHomeBanner[] }>('/admin/banners').then((r) => r.data),
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: BannerFormValues) =>
      apiClient.post<AdminHomeBanner>('/admin/banners', formToCreatePayload(values)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBannersQueryKey });
      void qc.invalidateQueries({ queryKey: homeBannersQueryKey });
    },
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BannerFormValues }) =>
      apiClient.patch<AdminHomeBanner>(`/admin/banners/${id}`, formToUpdatePayload(values)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBannersQueryKey });
      void qc.invalidateQueries({ queryKey: homeBannersQueryKey });
    },
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/banners/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBannersQueryKey });
      void qc.invalidateQueries({ queryKey: homeBannersQueryKey });
    },
  });
}

export function useReorderBanners() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      apiClient.patch<{ data: AdminHomeBanner[] }>('/admin/banners/reorder', { orderedIds }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBannersQueryKey });
      void qc.invalidateQueries({ queryKey: homeBannersQueryKey });
    },
  });
}

export function useToggleBannerActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch<AdminHomeBanner>(`/admin/banners/${id}`, { isActive }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBannersQueryKey });
      void qc.invalidateQueries({ queryKey: homeBannersQueryKey });
    },
  });
}
