import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListingCard } from '@/components/listing-card';
import { useListingCompare } from '@/hooks/use-listing-compare';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useShellStore } from '@/stores/shell-store';
import { formatPrice } from '@/lib/utils';
import { calculateSavings } from '@/lib/offer-utils';
import { isRenderableListing } from '@/lib/catalog-groups';
import type { CompareSort } from '@/lib/offer-utils';
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';
import { useStartConversation } from '@/hooks/use-api';
import type { Listing } from '@/types';
import { getListingPharmacyId } from '@/lib/listing-utils';

const SORT_KEYS: CompareSort[] = ['price', 'expiry', 'distance'];

export function ComparisonPage() {
  const { t } = useTranslation();
  const { medicineId } = useParams<{ medicineId: string }>();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<CompareSort>('price');
  const { coords, requestLocation } = useGeolocation();
  const openModal = useShellStore((s) => s.openModal);
  const startChat = useStartConversation();

  const { data, isLoading, isError } = useListingCompare(medicineId, sortBy, coords);

  const handleSort = (key: CompareSort) => {
    if (key === 'distance' && !coords) requestLocation();
    setSortBy(key);
  };

  const handleBuy = (listing: Listing) => {
    openModal('buyRequest', {
      buyRequest: {
        listingId: listing.id,
        medicineName: listing.medicine.name,
        finalPrice: Number(listing.finalPrice),
        moq: listing.moq,
        availableQty: listing.availableQty,
        sellerId: getListingPharmacyId(listing),
      },
    });
  };

  const handleChat = async (listing: Listing) => {
    const userId = listing.pharmacy.userId ?? listing.pharmacy.user?.id;
    if (!userId) return;
    const conv = await startChat.mutateAsync({ participantId: userId, listingId: listing.id });
    navigate(`/chat/${conv.id}`);
  };

  if (isLoading) {
    return (
      <div>
        <TopBar title={t('compare.title')} showBack />
        <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <TopBar title={t('compare.title')} showBack />
        <p className="p-4 text-center text-text-secondary">{t('compare.loadError')}</p>
      </div>
    );
  }

  const { medicine, listings: rawListings, stats } = data;
  const listings = rawListings.filter(isRenderableListing);
  const bestPrice = stats.lowestPrice;

  return (
    <div className="pb-8" data-testid="comparison-page">
      <TopBar title={t('compare.title')} showBack />

      <div className="px-4 py-3 border-b border-border-subtle bg-surface-raised space-y-2">
        <h1 className="font-bold text-lg">{medicine.name}</h1>
        <p className="text-sm text-text-secondary">{medicine.packSize} · {medicine.company}</p>
        <div className="flex gap-4 text-sm">
          <span>{t('compare.sellerCount', { count: stats.sellerCount })}</span>
          <span className="text-primary font-semibold">{t('compare.bestPrice', { price: formatPrice(bestPrice) })}</span>
        </div>
      </div>

      <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-border-subtle">
        {SORT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs',
              sortBy === key ? 'border-primary bg-primary-subtle text-primary font-medium' : 'border-border-subtle',
            )}
            onClick={() => handleSort(key)}
            data-testid={`compare-sort-${key}`}
          >
            {t(`compare.sort.${key}`)}
          </button>
        ))}
      </div>

      {listings.length === 0 ? (
        <p className="p-8 text-center text-text-secondary">{t('search.noResults')}</p>
      ) : (
        <div className="p-4 space-y-3">
          {listings.map((listing, index) => {
            const price = Number(listing.finalPrice);
            const savings = calculateSavings(price, bestPrice);
            const isBest = index === 0 && sortBy === 'price';

            return (
              <div
                key={listing.id}
                className={cn(
                  'rounded-[var(--radius-md)] border p-3 space-y-2',
                  isBest ? 'border-primary bg-primary-subtle/30' : 'border-border-subtle bg-surface-base',
                )}
                data-testid={`compare-row-${listing.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{listing.pharmacy.name}</p>
                    <p className="text-xs text-text-secondary">⭐ {listing.pharmacy.rating} · {listing.pharmacy.city}</p>
                    {listing.distanceKm != null && (
                      <p className="text-xs text-text-secondary">{t('compare.distance', { km: listing.distanceKm.toFixed(1) })}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-primary">{formatPrice(price)}</p>
                    {isBest && <span className="text-[10px] text-primary font-medium">{t('compare.lowestPrice')}</span>}
                    {savings > 0 && !isBest && (
                      <span className="text-[10px] text-danger block">+{formatPrice(savings)}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleBuy(listing)}>{t('listing.buyNow')}</Button>
                  <Button size="sm" variant="secondary" onClick={() => void handleChat(listing)}>
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {t('listing.messageSeller')}
                  </Button>
                </div>
              </div>
            );
          })}

          <div className="pt-4 space-y-3">
            <h2 className="font-semibold text-sm">{t('compare.detailedOffers')}</h2>
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} variant="list" showActions bestPrice={bestPrice} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
