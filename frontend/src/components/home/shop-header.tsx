import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, MapPin } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import type { Pharmacy } from '@/types';

export function ShopHeader() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const hasPharmacy = Boolean(user?.pharmacy);

  const { data: pharmacy } = useQuery({
    queryKey: ['pharmacy', 'me'],
    queryFn: () => apiClient.get<Pharmacy & { address?: string }>('/pharmacies/me'),
    enabled: hasPharmacy,
  });

  const name = pharmacy?.name ?? user?.pharmacy?.name ?? t('home.marketplaceName');
  const city = pharmacy?.city ?? t('home.defaultLocation');
  const isVerified = (pharmacy?.verificationStatus ?? user?.pharmacy?.verificationStatus) === 'APPROVED';

  return (
    <div
      className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4"
      data-testid="shop-header"
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-primary-subtle flex items-center justify-center text-primary font-bold text-lg shrink-0">
          {name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold truncate">{name}</h2>
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3 w-3" />
                {t('home.verified')}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {city}
          </p>
          <span className="inline-block mt-2 text-[10px] font-medium text-text-secondary border border-border-subtle rounded-full px-2 py-0.5">
            {t('home.madeInIndia')}
          </span>
        </div>
      </div>
    </div>
  );
}
