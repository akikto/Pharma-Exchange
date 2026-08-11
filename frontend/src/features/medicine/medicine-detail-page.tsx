import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, GitCompare, Heart, TrendingUp } from 'lucide-react';
import { VerifiedBadge } from '@/components/pharmacy/verified-badge';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { Skeleton } from '@/components/ui/skeleton';
import { ListingCard } from '@/components/listing-card';
import { ContactActions } from '@/components/offers/contact-actions';
import { PriceTrendDialog } from '@/components/offers/price-trend-dialog';
import { apiClient } from '@/lib/api';
import { formatPrice, getExpiryStatus, getExpiryLabel, cn } from '@/lib/utils';
import { isLowStock } from '@/lib/offer-utils';
import { useAddToCart } from '@/hooks/use-api';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { PharmacyContactActions } from '@/components/pharmacy/pharmacy-contact-actions';
import { usePharmacyProfile } from '@/hooks/use-pharmacy';
import { formatPharmacyAddress } from '@/lib/shop-utils';
import { useListings } from '@/hooks/use-listings';
import { useShellStore } from '@/stores/shell-store';
import { useToggleWatchlist, useIsWatched } from '@/hooks/use-watchlist';
import { useToast } from '@/hooks/use-toast';
import { isRenderableListing } from '@/lib/catalog-groups';
import { debugListingAction, warnInvalidListing } from '@/lib/listing-debug';
import { getListingPharmacyId } from '@/lib/listing-utils';

import type { Listing } from '@/types';

export function MedicineDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddToCart();
  const badges = useNavBadges();
  const openModal = useShellStore((s) => s.openModal);
  const cartSummaryVisible = badges.cart + badges.requests > 0;
  const { toast } = useToast();
  const toggleWatchlist = useToggleWatchlist();
  const [trendOpen, setTrendOpen] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => apiClient.get<Listing>(`/listings/${id}`),
    enabled: !!id,
  });

  const watched = useIsWatched(listing?.medicine?.id ?? '');

  if (isLoading) return <div className="p-4"><Skeleton className="aspect-square w-full" /><Skeleton className="h-8 w-2/3 mt-4" /></div>;
  if (!listing) return <div className="p-4 text-center text-text-secondary">{t('listing.notFound')}</div>;

  const expiryStatus = getExpiryStatus(listing.expiryDate);
  const lowStock = isLowStock(listing.availableQty, listing.moq);
  const verified = listing.pharmacy.verificationStatus === 'APPROVED';

  const handleAddToCart = () => {
    debugListingAction('medicine-detail:add-to-cart', { listingId: listing?.id, quantity, listing });
    if (!listing?.id) {
      warnInvalidListing('medicine-detail:add-to-cart', { listing });
      toast({ title: t('toast.error'), description: t('search.addToCartError'), variant: 'destructive' });
      return;
    }
    addToCart.mutate(
      { listingId: listing.id, quantity },
      { onSuccess: () => toast({ description: t('toast.addedToCart') }) },
    );
  };

  const handleBuyNow = () => {
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

  return (
    <div className={cn(cartSummaryVisible ? 'pb-shell-with-action-bar-and-cart' : 'pb-shell-with-action-bar')}>
      <TopBar showBack />
      <div className="aspect-square bg-surface-sunken">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.medicine.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">💊</div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-start gap-2">
            <h1 className="text-xl font-bold flex-1">{listing.medicine.name}</h1>
            {verified && <VerifiedBadge size="md" className="shrink-0" />}
          </div>
          <p className="text-text-secondary">{listing.medicine.packSize} · {listing.medicine.company}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link to={`/medicine/${listing.medicine.id}/compare`}>
              <GitCompare className="h-4 w-4 mr-1" />
              {t('compare.title')}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleWatchlist.mutate(listing.medicine.id, {
              onSuccess: (r) => toast({ description: r.added ? t('search.addedWatchlist') : t('search.removedWatchlist') }),
            })}
          >
            <Heart className={cn('h-4 w-4 mr-1', watched && 'fill-primary text-primary')} />
            {t('search.watchlist')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setTrendOpen(true)}>
            <TrendingUp className="h-4 w-4 mr-1" />
            {t('offer.priceTrend')}
          </Button>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold tabular-nums text-primary">{formatPrice(listing.finalPrice)}</span>
          {listing.discountPercent > 0 && (
            <span className="text-text-disabled line-through tabular-nums">{formatPrice(listing.sellingPrice)}</span>
          )}
        </div>

        <p className="text-sm text-text-secondary">{t('listing.moq', { count: listing.moq })} · {t('listing.available', { count: listing.availableQty })}</p>
        {lowStock && <p className="text-sm text-warning font-medium">{t('offer.lowStock')}</p>}
        <StatusChip label={t('listing.expiry', { label: getExpiryLabel(listing.expiryDate) })} variant={expiryStatus === 'safe' ? 'success' : expiryStatus} />

        <ContactActions listing={listing} medicineName={listing.medicine.name} size="md" />

        <Link to={`/pharmacy/${listing.pharmacy.id}`} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-border-subtle">
          <div className="h-10 w-10 rounded-full bg-primary-subtle flex items-center justify-center text-primary font-bold">
            {listing.pharmacy.name[0]}
          </div>
          <div className="flex-1">
            <p className="font-medium">{listing.pharmacy.name}</p>
            <p className="text-xs text-text-secondary">⭐ {listing.pharmacy.rating} · {listing.pharmacy.city}</p>
          </div>
        </Link>

        {listing.medicine.composition && (
          <div>
            <h3 className="font-semibold text-sm mb-1">{t('listing.composition')}</h3>
            <p className="text-sm text-text-secondary">{listing.medicine.composition}</p>
          </div>
        )}
      </div>

      <div
        data-testid="product-action-bar"
        className={cn(
          'fixed left-0 right-0 z-[45] border-t border-border-subtle bg-surface-base px-3 py-3 lg:left-60',
          cartSummaryVisible ? 'shell-above-cart-summary' : 'shell-above-bottom-nav',
        )}
      >
        <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2">
          <div className="flex shrink-0 items-center justify-between border border-border-subtle rounded-[var(--radius-md)]">
            <button type="button" className="p-2" onClick={() => setQuantity(Math.max(listing.moq, quantity - 1))} aria-label={t('listing.decreaseQty', { defaultValue: 'Decrease quantity' })}><Minus className="h-4 w-4" /></button>
            <span className="w-7 text-center tabular-nums text-sm font-medium">{quantity}</span>
            <button type="button" className="p-2" onClick={() => setQuantity(Math.min(listing.availableQty, quantity + 1))} aria-label={t('listing.increaseQty', { defaultValue: 'Increase quantity' })}><Plus className="h-4 w-4" /></button>
          </div>
          <Button className="min-w-0 h-10 px-2 text-xs sm:text-sm" variant="secondary" onClick={handleBuyNow}>{t('listing.buyNow')}</Button>
          <Button className="min-w-0 h-10 px-2 text-xs sm:text-sm" onClick={handleAddToCart} loading={addToCart.isAddingToCart(listing?.id)}>{t('listing.addToCart')}</Button>
        </div>
      </div>

      <PriceTrendDialog
        open={trendOpen}
        onOpenChange={setTrendOpen}
        medicineId={listing.medicine.id}
        medicineName={listing.medicine.name}
        currentPrice={Number(listing.finalPrice)}
      />
    </div>
  );
}

export function PharmacyProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: pharmacy, isLoading } = usePharmacyProfile(id);
  const { data: listingsData, isLoading: listingsLoading } = useListings({ pharmacyId: id });
  const listings = (listingsData?.pages.flatMap((p) => p.data) ?? []).filter(isRenderableListing);

  if (isLoading) return <div className="p-4"><Skeleton className="h-24 w-full" /></div>;
  if (!pharmacy) return <div className="p-4 text-center text-danger">{t('common.error')}</div>;

  const isVerified = pharmacy.verificationStatus === 'APPROVED';
  const fullAddress = formatPharmacyAddress(pharmacy);

  return (
    <div data-testid="pharmacy-profile-page">
      <TopBar showBack />
      <div className="p-4 space-y-5">
        <div className="text-center space-y-2">
          <div className="h-16 w-16 rounded-full bg-primary-subtle flex items-center justify-center text-2xl font-bold text-primary mx-auto">
            {pharmacy.name[0]}
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{pharmacy.name}</h1>
            {isVerified && <VerifiedBadge size="md" />}
          </div>
          <p className="text-text-secondary text-sm">
            ⭐ {pharmacy.rating}
            {pharmacy.ratingCount ? ` (${pharmacy.ratingCount})` : ''}
            {' · '}
            {pharmacy.city}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised">
            <p className="text-xs text-text-secondary">{t('shop.dealsCompleted')}</p>
            <p className="font-semibold text-lg tabular-nums">{pharmacy.dealsCompleted}</p>
          </div>
          <div className="p-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised">
            <p className="text-xs text-text-secondary">{t('shop.license')}</p>
            <p className="font-medium text-sm break-all">{pharmacy.licenseNumber}</p>
          </div>
        </div>

        {pharmacy.owner && (
          <div>
            <p className="text-xs text-text-secondary">{t('shop.owner')}</p>
            <p className="font-medium">{pharmacy.owner.name}</p>
          </div>
        )}

        {fullAddress && (
          <div>
            <p className="text-xs text-text-secondary">{t('pharmacy.address')}</p>
            <p className="text-sm">{fullAddress}</p>
          </div>
        )}

        {pharmacy.description && (
          <div>
            <p className="text-xs text-text-secondary">{t('pharmacy.description')}</p>
            <p className="text-sm text-text-secondary">{pharmacy.description}</p>
          </div>
        )}

        <PharmacyContactActions
          ownerId={pharmacy.owner?.id}
          phone={pharmacy.owner?.phone}
          pharmacyName={pharmacy.name}
        />

        <h2 className="font-semibold">{t('listing.listings')}</h2>
        {listingsLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : listings.length === 0 ? (
          <p className="text-text-secondary text-sm">{t('listing.noListings')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
