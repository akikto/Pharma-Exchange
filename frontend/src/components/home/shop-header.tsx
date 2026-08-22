import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MapPin, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoShopStore } from '@/stores/demo-shop-store';
import { apiClient } from '@/lib/api';
import { useDemoShops } from '@/hooks/use-pharmacy';
import { resolveActiveShop } from '@/lib/shop-utils';
import { VerifiedBadge } from '@/components/pharmacy/verified-badge';
import type { Pharmacy } from '@/types';
import { cn } from '@/lib/utils';

export function ShopHeader({ className }: { className?: string }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const hasPharmacy = Boolean(user?.pharmacy);
  const { activeShopId, setActiveShopId } = useDemoShopStore();
  const { data: demoShops } = useDemoShops();

  const { data: myPharmacy } = useQuery({
    queryKey: ['pharmacy', 'me'],
    queryFn: () => apiClient.get<Pharmacy & { address?: string }>('/pharmacies/me'),
    enabled: hasPharmacy,
  });

  const activeShop = resolveActiveShop(demoShops, activeShopId, myPharmacy ?? user?.pharmacy);
  const name = activeShop?.name ?? t('home.marketplaceName');
  const city = activeShop?.city ?? t('home.defaultLocation');
  const isVerified = activeShop?.verificationStatus === 'APPROVED';
  const profileId = activeShop?.id;

  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-3 space-y-2.5',
        className,
      )}
      data-testid="shop-header"
    >
      <div className="flex items-start gap-3">
        {profileId ? (
          <Link to={`/pharmacy/${profileId}`} className="h-12 w-12 rounded-full bg-primary-subtle flex items-center justify-center text-primary font-bold text-lg shrink-0">
            {name[0]}
          </Link>
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary-subtle flex items-center justify-center text-primary font-bold text-lg shrink-0">
            {name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {profileId ? (
              <Link to={`/pharmacy/${profileId}`} className="font-semibold truncate hover:text-primary">
                {name}
              </Link>
            ) : (
              <h2 className="font-semibold truncate">{name}</h2>
            )}
            {isVerified && <VerifiedBadge size="sm" />}
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

      {demoShops && demoShops.length > 1 && (
        <div data-testid="shop-switcher">
          <label className="text-xs text-text-secondary block mb-1">{t('shop.switchLabel')}</label>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 py-2 pr-8 text-sm"
              value={activeShopId ?? ''}
              onChange={(e) => setActiveShopId(e.target.value || null)}
            >
              <option value="">{t('shop.allShops')}</option>
              {demoShops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name} · {shop.city}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}
