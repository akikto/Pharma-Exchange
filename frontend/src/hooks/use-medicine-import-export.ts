import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { MedicineImportMode, MedicineImportPreviewResult, MedicineImportResult } from '@/lib/medicine-import-types';

export function useMedicineImportPreview() {
  return useMutation({
    mutationFn: ({ file, mode }: { file: File; mode: MedicineImportMode }) => {
      const form = new FormData();
      form.append('file', file);
      form.append('mode', mode);
      return apiClient.post<MedicineImportPreviewResult>('/admin/medicines/import/preview', form);
    },
  });
}

export function useMedicineImportCommit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, mode }: { file: File; mode: MedicineImportMode }) => {
      const form = new FormData();
      form.append('file', file);
      form.append('mode', mode);
      return apiClient.post<MedicineImportResult>('/admin/medicines/import', form);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'medicines'] });
      void qc.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}

export async function downloadMedicineTemplate(): Promise<void> {
  await apiClient.download('/admin/medicines/import/template', 'pharma-exchange-medicines-template.xlsx');
}

export async function exportMedicinesFile(format: 'csv' | 'xlsx', search: string): Promise<void> {
  const params = new URLSearchParams({ format });
  const q = search.trim();
  if (q) params.set('q', q);
  const date = new Date().toISOString().slice(0, 10);
  await apiClient.download(
    `/admin/medicines/export?${params.toString()}`,
    `pharma-exchange-medicines-${date}.${format}`,
  );
}
