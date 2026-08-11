import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

type UploadMedicineImageResponse = {
  url: string;
  storageKey: string;
  fileName: string;
};

export function useMedicineImageUpload() {
  return useMutation({
    mutationFn: async ({ file, replaceUrl }: { file: File; replaceUrl?: string }) => {
      const form = new FormData();
      form.append('file', file);
      if (replaceUrl) form.append('replaceUrl', replaceUrl);
      return apiClient.post<UploadMedicineImageResponse>('/upload/medicine-image', form);
    },
  });
}
