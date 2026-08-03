import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingCart, Heart, GitCompare, Clock, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { VerifiedBadge } from '@/components/pharmacy/verified-badge';
import { formatPrice, getExpiryStatus, getExpiryLabel, cn } from '@/lib/utils';
import { isLowStock, calculateSavings, formatSavingsPercent } from '@/lib/offer-utils';
import { isRenderableListing } from '@/lib/catalog-groups';
import { StatusChip } from '@/components/ui/status-chip';
import { Button } from '@/components/ui/button';
import { useAddToCart } from '@/hooks/use-api';
import { useToggleWatchlist, useIsWatched } from '@/hooks/use-watchlist';
import { useShellStore } from '@/stores/shell-store';
import { useToast } from '@/hooks/use-toast';
import { ContactActions } from '@/components/offers/contact-actions';
import { PriceTrendDialog } from '@/components/offers/price-trend-dialog';
import type { Listing } from '@/types';

interface OfferCardProps {
  listing: Listing;
  className?: string;
  variant?: 'grid' | 'list';
  showActions?: boolean;
  bestPrice?: number;
}

export function OfferCard(props: OfferCardProps) {
  if (!isRenderableListing(props.listing)) return null;
  return <OfferCardContent {...props} listing={props.listing} />;
}

function OfferCardContent({
  listing,
  className,
  variant = 'grid',
  showActions = false,
  bestPrice,
}: OfferCardProps & { listing: Listing }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const toggleWatchlist = useToggleWatchlist();
  const openModal = useShellStore((s) => s.openModal);
  const [trendOpen, setTrendOpen] = useState(false);

  const expiryStatus = getExpiryStatus(listing.expiryDate);
  const hasDiscount = listing.discountPercent > 0;
  const watched = useIsWatched(listing.medicine.id);
  const lowStock = isLowStock(listing.availableQty, listing.moq);
  const verified = listing.pharmacy.verificationStatus === 'APPROVED';
  const price = Number(listing.finalPrice);
  const savings = bestPrice !== undefined ? calculateSavings(price, bestPrice) : 0;
  const savingsPct = bestPrice !== undefined ? formatSavingsPercent(price, bestPrice) : 0;

  const urgencyBorder =
    expiryStatus === 'danger' ? 'border-danger'
    : lowStock ? 'border-warning'
    : 'border-border-subtle';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart.mutate(
      { listingId: listing.id, quantity: listing.moq },
      {
        onSuccess: () => toast({ title: t('search.addedToCart') }),
        onError: () => toast({ title: t('search.addToCartError'), variant: 'destructive' }),
      },
    );
  };

  const handleBuyRequest = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openModal('buyRequest', {
      buyRequest: {
        listingId: listing.id,
        medicineName: listing.medicine.name,
        finalPrice: price,
        moq: listing.moq,
        availableQty: listing.availableQty,
        sellerId: listing.pharmacy.userId ?? listing.pharmacy.id,
      },
    });
  };

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist.mutate(listing.medicine.id, {
      onSuccess: (r) => toast({ title: r.added ? t('search.addedWatchlist') : t('search.removedWatchlist') }),
    });
  };

  const compareUrl = `/medicine/${listing.medicine.id}/compare`;

  const imageBlock = (
    <div className={cn('relative bg-surface-sunken shrink-0', variant === 'grid' ? 'aspect-square' : 'h-24 w-24 rounded-[var(--radius-md)]')}>
      {listing.imageUrl ? (
        <img src={listing.imageUrl} alt={listing.medicine.name} className="h-full w-full object-cover rounded-[inherit]" loading="lazy" />
      ) : (
        <div className="flex h-full items-center justify-center text-text-disabled text-3xl rounded-[inherit]">💊</div>
      )}
      {hasDiscount && (
        <span className="absolute top-1.5 right-1.5 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-medium text-white">
          -{listing.discountPercent}%
        </span>
      )}
      {lowStock && (
        <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded bg-warning px-1.5 py-0.5 text-[10px] font-medium text-white">
          <AlertTriangle className="h-3 w-3" />
          {t('offer.lowStock')}
        </span>
      )}
    </div>
  );

  const infoBlock = (
    <div className="flex-1 min-w-0 space-y-1">
      <div className="flex items-start gap-1">
        <h3 className={cn('font-semibold line-clamp-2', variant === 'grid' ? 'text-sm' : 'text-base')}>{listing.medicine.name}</h3>
        {verified && <VerifiedBadge size="sm" className="shrink-0" />}
      </div>
      <p className="text-xs text-text-secondary">{listing.medicine.packSize} · {listing.medicine.company}</p>
      <p className="text-xs text-text-secondary">⭐ {listing.pharmacy.rating} · {listing.pharmacy.name} · {listing.pharmacy.city}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-base font-semibold tabular-nums text-primary">{formatPrice(listing.finalPrice)}</span>
        {hasDiscount && (
          <span className="text-xs text-text-disabled line-through tabular-nums">{formatPrice(listing.sellingPrice)}</span>
        )}
        {savings > 0 && (
          <span className="text-[10px] text-danger font-medium">+{formatPrice(savings)} ({savingsPct}%)</span>
        )}
      </div>
      <p className="text-xs text-text-secondary">{t('listing.moq', { count: listing.moq })} · {t('listing.available', { count: listing.availableQty })}</p>
      <StatusChip
        label={t('listing.expiry', { label: getExpiryLabel(listing.expiryDate) })}
        variant={expiryStatus === 'safe' ? 'success' : expiryStatus}
        icon={Clock}
      />
    </div>
  );

  return (
    <>
      <div
        className={cn(
          'rounded-[var(--radius-md)] border bg-surface-base overflow-hidden transition-shadow hover:shadow-md',
          urgencyBorder,
          className,
        )}
        data-testid={`offer-card-${listing.id}`}
      >
        <Link
          to={`/medicine/${listing.id}`}
          className={cn('block active:scale-[0.99] transition-transform', variant === 'list' ? 'flex gap-3 p-3' : '')}
        >
          {variant === 'grid' ? (
            <>
              {imageBlock}
              <div className="p-3">{infoBlock}</div>
            </>
          ) : (
            <>
              {imageBlock}
              {infoBlock}
            </>
          )}
        </Link>

        {(showActions || variant === 'list') && (
          <div className="flex flex-col gap-2 p-2 pt-0 border-t border-border-subtle">
            <div className="flex gap-1 items-center">
              <Button variant="secondary" size="sm" className="flex-1 h-8 text-xs" onClick={handleBuyRequest}>
                {t('listing.buyNow')}
              </Button>
              <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={handleAddToCart} loading={addToCart.isAddingToCart(listing.id)}>
                <ShoppingCart className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('search.watchlist')} onClick={handleWatchlist}>
                <Heart className={cn('h-4 w-4', watched && 'fill-primary text-primary')} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('offer.priceTrend')} onClick={(e) => { e.preventDefault(); setTrendOpen(true); }}>
                <TrendingUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('search.compare')} asChild>
                <Link to={compareUrl} onClick={(e) => e.stopPropagation()}><GitCompare className="h-4 w-4" /></Link>
              </Button>
            </div>
            <ContactActions listing={listing} size="sm" />
          </div>
        )}
      </div>

      <PriceTrendDialog
        open={trendOpen}
        onOpenChange={setTrendOpen}
        medicineId={listing.medicine.id}
        medicineName={listing.medicine.name}
        currentPrice={price}
      />
    </>
  );
}
