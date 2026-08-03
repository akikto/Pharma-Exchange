import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Listing } from '@/types';

export interface AiMatch {
  id: string;
  score: number;
  reason: string;
  summary: string;
  contextLabel?: string;
  listing: Listing | null;
}

export interface AiMatchesResponse {
  data: AiMatch[];
  source: 'gemini' | 'rules';
  generatedAt: string;
}

export function useAiMatches(role: 'buyer' | 'seller' = 'buyer', enabled = true) {
  return useQuery({
    queryKey: ['ai-matches', role],
    queryFn: () => apiClient.get<AiMatchesResponse>(`/ai-matches?role=${role}`),
    enabled,
    staleTime: 60_000,
  });
}
