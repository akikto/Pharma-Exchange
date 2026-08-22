import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

type UploadBannerMediaResponse = {
  url: string;
  storageKey: string;
  fileName: string;
};

export function useBannerMediaUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiClient.post<UploadBannerMediaResponse>('/upload/banner-media', form);
    },
  });
}
