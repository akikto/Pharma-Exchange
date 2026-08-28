import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { AdminHomeBanner, BannerFormValues, BannerStatus } from '@/lib/banner-form';
import { formToCreatePayload, formToUpdatePayload } from '@/lib/banner-form';

export type BannerLocationParams = {
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
};

function buildBannerQuery(location?: BannerLocationParams) {
  const params = new URLSearchParams();
  if (location?.latitude != null && location?.longitude != null) {
    params.set('latitude', String(location.latitude));
    params.set('longitude', String(location.longitude));
  }
  if (location?.country) params.set('country', location.country);
  if (location?.state) params.set('state', location.state);
  if (location?.city) params.set('city', location.city);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const homeBannersQueryKey = ['banners', 'active'] as const;
export const adminBannersQueryKey = ['admin', 'banners'] as const;

export function useHomeBanners(location?: BannerLocationParams) {
  return useQuery({
    queryKey: [...homeBannersQueryKey, location ?? {}],
    queryFn: () =>
      apiClient
        .get<{ data: AdminHomeBanner[] }>(`/banners${buildBannerQuery(location)}`)
        .then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useAdminBanners(filters?: { status?: BannerStatus; bannerType?: 'ADMIN' | 'SELLER_AD' }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.bannerType) params.set('bannerType', filters.bannerType);
  const query = params.toString();
  return useQuery({
    queryKey: [...adminBannersQueryKey, filters ?? {}],
    queryFn: () =>
      apiClient
        .get<{ data: AdminHomeBanner[] }>(`/admin/banners${query ? `?${query}` : ''}`)
        .then((r) => r.data),
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

export function useApproveBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<AdminHomeBanner>(`/admin/banners/${id}/approve`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBannersQueryKey });
      void qc.invalidateQueries({ queryKey: homeBannersQueryKey });
    },
  });
}

export function useRejectBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      apiClient.post<AdminHomeBanner>(`/admin/banners/${id}/reject`, { rejectionReason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBannersQueryKey });
      void qc.invalidateQueries({ queryKey: homeBannersQueryKey });
    },
  });
}

export function usePauseBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<AdminHomeBanner>(`/admin/banners/${id}/pause`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBannersQueryKey });
      void qc.invalidateQueries({ queryKey: homeBannersQueryKey });
    },
  });
}

export function useResumeBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<AdminHomeBanner>(`/admin/banners/${id}/resume`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBannersQueryKey });
      void qc.invalidateQueries({ queryKey: homeBannersQueryKey });
    },
  });
}
