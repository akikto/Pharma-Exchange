import { useTranslation } from 'react-i18next';
import { MapPin, Shield, Truck, Package, Star } from 'lucide-react';
import { StatusChip } from '@/components/ui/status-chip';
import { formatDate, getExpiryLabel, getExpiryStatus } from '@/lib/utils';
import {
  formatDistanceKmLabel,
  getListingExpiryDays,
  hasMedicineClinicalInfo,
  resolveListingDistanceKm,
  showsListingAuthenticBadge,
  showsListingFastDeliveryBadge,
} from '@/lib/listing-detail-display';
import type { Listing } from '@/types';

interface ListingDetailInsightsProps {
  listing: Listing;
  userCoords?: { latitude: number; longitude: number } | null;
}

export function ListingDetailInsights({ listing, userCoords }: ListingDetailInsightsProps) {
  const { t } = useTranslation();
  const distanceKm = resolveListingDistanceKm(listing, userCoords);
  const expiryDays = getListingExpiryDays(listing.expiryDate);
  const expiryStatus = getExpiryStatus(listing.expiryDate);
  const monthLabel = getExpiryLabel(listing.expiryDate);
  const showAuthentic = showsListingAuthenticBadge(listing);
  const showFastDelivery = showsListingFastDeliveryBadge(listing, distanceKm);
  const deliveryMode = listing.deliveryMode ?? 'SELLER_DELIVERS';
  const clinical = hasMedicineClinicalInfo(listing.medicine);

  return (
    <div className="space-y-3" data-testid="listing-detail-insights">
      <p
        className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-warning"
        data-testid="listing-seller-rating"
      >
        <Star className="h-4 w-4 fill-warning text-warning" aria-hidden />
        {t('listing.sellerRating', { rating: listing.pharmacy.rating })}
      </p>

      {(showAuthentic || showFastDelivery) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {showAuthentic && (
            <span className="inline-flex items-center gap-1 text-success font-medium">
              <Shield className="h-4 w-4" aria-hidden />
              {t('listing.authentic')}
            </span>
          )}
          {showFastDelivery && (
            <span className="inline-flex items-center gap-1 text-text-secondary">
              <Truck className="h-4 w-4" aria-hidden />
              {t('listing.fastDelivery')}
            </span>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <StatusChip
          label={t('listing.expiry', { label: monthLabel })}
          variant={expiryStatus === 'safe' ? 'success' : expiryStatus}
        />
        <p className="text-sm text-warning font-medium">{t('listing.expiryDays', { count: expiryDays })}</p>
        <p className="text-sm text-text-secondary">
          {t('listing.expiryDateLine', { date: formatDate(listing.expiryDate) })}
        </p>
      </div>

      {distanceKm != null && (
        <p className="text-sm text-text-secondary inline-flex items-center gap-1">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {t('listing.distanceFromYou', { km: formatDistanceKmLabel(distanceKm) })}
        </p>
      )}

      <div className="rounded-[var(--radius-md)] border border-primary/30 bg-primary-subtle/40 p-3 space-y-1">
        <p className="text-xs font-semibold text-primary flex items-center gap-1">
          <Package className="h-4 w-4" aria-hidden />
          {t('listing.itemHandoverTitle')}
        </p>
        <p className="text-sm font-medium">
          {deliveryMode === 'BUYER_PICKUP'
            ? t('listing.deliveryModeBuyerPickup')
            : t('listing.deliveryModeSellerDelivers')}
        </p>
        {listing.estimatedDeliveryDays != null && listing.estimatedDeliveryDays > 0 ? (
          <p className="text-sm text-text-secondary">
            {t('listing.deliveryInDays', { count: listing.estimatedDeliveryDays })}
          </p>
        ) : null}
      </div>

      {clinical && (
        <div className="space-y-3 border-t border-border-subtle pt-3">
          {listing.medicine.indications?.trim() ? (
            <div>
              <h3 className="font-semibold text-sm mb-1">{t('listing.indications')}</h3>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{listing.medicine.indications}</p>
            </div>
          ) : null}
          {listing.medicine.dosageInstructions?.trim() ? (
            <div>
              <h3 className="font-semibold text-sm mb-1">{t('listing.dosageInstructions')}</h3>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{listing.medicine.dosageInstructions}</p>
            </div>
          ) : null}
          {listing.medicine.sideEffects?.trim() ? (
            <div>
              <h3 className="font-semibold text-sm mb-1">{t('listing.sideEffects')}</h3>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{listing.medicine.sideEffects}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
