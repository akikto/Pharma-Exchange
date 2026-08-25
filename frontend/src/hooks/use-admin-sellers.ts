import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { PaginatedResponse } from '@/types';
import type {
  AdminPharmacyUpdatePayload,
  AdminSellerDetail,
  AdminSellerListItem,
  PharmacyVerificationStatus,
} from '@/lib/admin-sellers';

export interface AdminSellersFilters {
  q: string;
  verificationStatus: PharmacyVerificationStatus | 'ALL';
  isActive: 'all' | 'active' | 'inactive';
}

export function adminSellersQueryKey(filters: AdminSellersFilters) {
  return ['admin', 'pharmacies', filters] as const;
}

export function useAdminSellers(filters: AdminSellersFilters) {
  const params = new URLSearchParams({ limit: '50' });
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.verificationStatus !== 'ALL') {
    params.set('verificationStatus', filters.verificationStatus);
  }
  if (filters.isActive === 'active') params.set('isActive', 'true');
  if (filters.isActive === 'inactive') params.set('isActive', 'false');

  return useQuery({
    queryKey: adminSellersQueryKey(filters),
    queryFn: () =>
      apiClient.get<PaginatedResponse<AdminSellerListItem>>(`/admin/pharmacies?${params.toString()}`),
  });
}

export function useAdminSellerDetail(pharmacyId: string | null) {
  return useQuery({
    queryKey: ['admin', 'pharmacies', pharmacyId],
    queryFn: () => apiClient.get<AdminSellerDetail>(`/admin/pharmacies/${pharmacyId}`),
    enabled: Boolean(pharmacyId),
  });
}

export function useVerifyPharmacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, rejectionReason }: { id: string; action: 'approve' | 'reject'; rejectionReason?: string }) =>
      apiClient.post(`/admin/verifications/${id}`, { action, rejectionReason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'pharmacies'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'verifications'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useUpdatePharmacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminPharmacyUpdatePayload }) =>
      apiClient.patch(`/admin/pharmacies/${id}`, payload),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'pharmacies'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'pharmacies', variables.id] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useDeletePharmacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirmName }: { id: string; confirmName: string }) =>
      apiClient.delete(`/admin/pharmacies/${id}`, { confirmName }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'pharmacies'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

/** @deprecated Use useUpdatePharmacy */
export function useUpdatePharmacyActive() {
  const update = useUpdatePharmacy();
  return {
    ...update,
    mutate: (vars: { id: string; isActive: boolean }, options?: Parameters<typeof update.mutate>[1]) =>
      update.mutate({ id: vars.id, payload: { isActive: vars.isActive } }, options),
    mutateAsync: (vars: { id: string; isActive: boolean }) =>
      update.mutateAsync({ id: vars.id, payload: { isActive: vars.isActive } }),
  };
}
