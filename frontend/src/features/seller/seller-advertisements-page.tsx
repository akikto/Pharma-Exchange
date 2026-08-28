import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Megaphone, Plus } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { StatusChip } from '@/components/ui/status-chip';
import { BannerFrame } from '@/components/banner/banner-frame';
import { BannerMedia } from '@/components/banner/banner-media';
import { useSellerAdvertisements } from '@/hooks/use-advertisements';
import { formatBannerTargetSummary } from '@/lib/banner-form';

export function SellerAdvertisementsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useSellerAdvertisements();
  const ads = useMemo(() => data ?? [], [data]);

  return (
    <div data-testid="seller-advertisements-page">
      <TopBar title={t('sellerAds.title')} showBack backTo="/seller" />
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">{t('sellerAds.description')}</p>
          <Link to="/seller/advertisements/new">
            <Button data-testid="seller-ad-create-button">
              <Plus className="h-4 w-4" />
              {t('sellerAds.createButton')}
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <p className="text-center text-danger py-12">{t('sellerAds.loadError')}</p>
        ) : ads.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-border-subtle p-8 text-center space-y-3">
            <Megaphone className="h-10 w-10 mx-auto text-text-secondary" />
            <p className="text-text-secondary">{t('sellerAds.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <article
                key={ad.id}
                className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-base p-3 space-y-3"
                data-testid={`seller-ad-row-${ad.id}`}
              >
                <div className="max-w-sm">
                  <BannerFrame>
                    <BannerMedia
                      mediaUrl={ad.mediaUrl}
                      mediaType={ad.mediaType}
                      alt={ad.mediaAlt || ad.title}
                      isActive
                    />
                  </BannerFrame>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{ad.title}</p>
                    <p className="text-xs text-text-secondary">
                      {t('sellerAds.targetSummary', { target: formatBannerTargetSummary(ad, t) })}
                    </p>
                    {ad.radiusKm ? (
                      <p className="text-xs text-text-secondary">{ad.radiusKm} km</p>
                    ) : null}
                    {ad.rejectionReason ? (
                      <p className="text-xs text-danger mt-1">
                        {t('sellerAds.rejectionReason', { reason: ad.rejectionReason })}
                      </p>
                    ) : null}
                  </div>
                  <StatusChip label={t(`sellerAds.status.${ad.status}`)} variant="info" />
                </div>
                <div className="flex gap-2">
                  <Link to={`/seller/advertisements/${ad.id}`}>
                    <Button size="sm" variant="secondary">{t('sellerAds.viewButton')}</Button>
                  </Link>
                  {['DRAFT', 'PENDING_APPROVAL', 'REJECTED'].includes(ad.status) ? (
                    <Link to={`/seller/advertisements/${ad.id}/edit`}>
                      <Button size="sm" variant="secondary">{t('sellerAds.editButton')}</Button>
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
