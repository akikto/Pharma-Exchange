import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { PaginatedResponse } from '@/types';
import type { MedicineRecord } from '@/lib/medicine-form';
import { formToCreatePayload, formToUpdatePayload, type MedicineFormValues } from '@/lib/medicine-form';

export function adminMedicinesQueryKey(search: string) {
  return ['admin', 'medicines', search] as const;
}

export function useAdminMedicines(search: string) {
  const query = search.trim();
  const params = new URLSearchParams({ limit: '50' });
  if (query) params.set('q', query);

  return useQuery({
    queryKey: adminMedicinesQueryKey(query),
    queryFn: () => apiClient.get<PaginatedResponse<MedicineRecord>>(`/medicines?${params.toString()}`),
  });
}

export function useCreateMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: MedicineFormValues) =>
      apiClient.post<MedicineRecord>('/medicines', formToCreatePayload(values)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'medicines'] });
      void qc.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}

export function useUpdateMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: MedicineFormValues }) =>
      apiClient.patch<MedicineRecord>(`/medicines/${id}`, formToUpdatePayload(values)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'medicines'] });
      void qc.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}
