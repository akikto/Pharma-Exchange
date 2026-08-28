import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { formToCreatePayload, type MedicineFormValues, type MedicineRecord } from '@/lib/medicine-form';

export function useCreateSellerMedicine() {
  return useMutation({
    mutationFn: (values: MedicineFormValues) =>
      apiClient.post<MedicineRecord>('/medicines/catalog', formToCreatePayload(values)),
  });
}
