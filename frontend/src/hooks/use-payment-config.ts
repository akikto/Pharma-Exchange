import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface PaymentConfig {
  provider: 'RAZORPAY';
  enabled: boolean;
  currency: string;
}

interface HealthResponse {
  payments?: PaymentConfig;
}

export function usePaymentConfig() {
  return useQuery({
    queryKey: ['health', 'payments'],
    queryFn: async () => {
      const res = await apiClient.get<HealthResponse>('/health');
      return res.payments ?? { provider: 'RAZORPAY' as const, enabled: false, currency: 'INR' };
    },
    staleTime: 5 * 60 * 1000,
  });
}
