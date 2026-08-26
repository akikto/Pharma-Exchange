import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  Star,
  Store,
  MapPin,
  Truck,
  Clock,
  Shield,
  Phone,
  ShoppingCart,
  Tag,
  CircleCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPhoneHref } from '@/lib/offer-utils';
import { getListingCompositionText } from '@/lib/listing-utils';
import { debugListingAction, warnInvalidListing } from '@/lib/listing-debug';
import {
  formatGenericStrengthLine,
  formatAiPickExpiryDate,
  formatSellerLocation,
  getDaysUntilExpiry,
  resolveAiPickDistanceKm,
  showsAiPickAuthenticBadge,
  showsAiPickFastDeliveryBadge,
} from '@/lib/ai-pick-card-utils';
import { useAddToCart } from '@/hooks/use-api';
import { useToggleWatchlist, useIsWatched } from '@/hooks/use-watchlist';
import { useToast } from '@/hooks/use-toast';
import type { Listing } from '@/types';

export interface HomeAiPickListingCardProps {
  listing: Listing;
  userCoords?: { latitude: number; longitude: number } | null;
  matchBadge?: { label: string; className: string };
  matchSummary?: string;
  className?: string;
}

export function HomeAiPickListingCard({
  listing,
  userCoords,
  matchBadge,
  matchSummary,
  className,
}: HomeAiPickListingCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const toggleWatchlist = useToggleWatchlist();
  const watched = useIsWatched(listing.medicine.id);

  const verified = listing.pharmacy.verificationStatus === 'APPROVED';
  const hasDiscount = listing.discountPercent > 0;
  const compositionText = getListingCompositionText(listing);
  const genericLine = formatGenericStrengthLine(listing, compositionText);
  const distanceKm = resolveAiPickDistanceKm(listing, userCoords);
  const daysUntilExpiry = getDaysUntilExpiry(listing.expiryDate);
  const expiryDateLabel = formatAiPickExpiryDate(listing.expiryDate);
  const showAuthentic = showsAiPickAuthenticBadge(listing);
  const showFastDelivery = showsAiPickFastDeliveryBadge(distanceKm);
  const phone = listing.pharmacy.user?.phone;
  const phoneHref = formatPhoneHref(phone);
  const canAddToCart = listing.status === 'ACTIVE' && listing.availableQty >= listing.moq;
  const detailsPath = `/medicine/${listing.id}`;
  const unitLabel = listing.unit?.trim() ? listing.unit.trim().toUpperCase() : t('aiMatch.units');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    debugListingAction('ai-pick-card:add-to-cart', { listingId: listing.id, moq: listing.moq, listing });
    if (!listing?.id) {
      warnInvalidListing('ai-pick-card:add-to-cart', { listing });
      toast({ title: t('search.addToCartError'), variant: 'destructive' });
      return;
    }
    addToCart.mutate(
      { listingId: listing.id, quantity: listing.moq },
      {
        onSuccess: () => toast({ title: t('aiMatch.addedToCart') }),
        onError: () => toast({ title: t('search.addToCartError'), variant: 'destructive' }),
      },
    );
  };

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist.mutate(listing.medicine.id, {
      onSuccess: (r) => toast({ title: r.added ? t('search.addedWatchlist') : t('search.removedWatchlist') }),
    });
  };

  const stopNav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <article
      className={cn(
        'flex min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-surface-base shadow-elevation-1',
        className,
      )}
      data-testid={`ai-pick-listing-card-${listing.id}`}
    >
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 z-10 h-8 w-8 text-text-disabled hover:text-danger"
          aria-label={t('search.watchlist')}
          data-testid={`ai-pick-watchlist-${listing.id}`}
          onClick={handleWatchlist}
        >
          <Heart className={cn('h-4 w-4', watched && 'fill-primary text-primary')} />
        </Button>

        <Link
          to={detailsPath}
          className="block min-w-0 flex-1 p-2.5 pr-9 active:scale-[0.995] transition-transform"
          data-testid={`ai-pick-card-link-${listing.id}`}
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-start gap-1.5 pr-1">
              <h3 className="text-sm font-bold leading-tight text-text-primary line-clamp-2">{listing.medicine.name}</h3>
              {matchBadge && (
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    matchBadge.className,
                  )}
                >
                  {matchBadge.label}
                </span>
              )}
            </div>

            {genericLine ? (
              <p className="text-[11px] text-text-secondary line-clamp-1">{genericLine}</p>
            ) : null}

            {listing.medicine.dosageForm ? (
              <span className="inline-flex rounded-full bg-primary-subtle px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                {listing.medicine.dosageForm}
              </span>
            ) : null}

            {matchSummary ? (
              <p className="text-[10px] text-text-secondary line-clamp-2">{matchSummary}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-text-secondary">
              <span className="inline-flex items-center gap-0.5 font-medium text-warning">
                <Star className="h-3 w-3 fill-warning text-warning" aria-hidden />
                {listing.pharmacy.rating}
              </span>
              <span className="inline-flex min-w-0 items-center gap-1 font-semibold text-text-primary">
                <Store className="h-3 w-3 shrink-0 text-text-disabled" aria-hidden />
                <span className="truncate">{listing.pharmacy.name}</span>
                {verified ? (
                  <CircleCheck className="h-3.5 w-3.5 shrink-0 text-success" aria-label={t('home.verified')} />
                ) : null}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-text-secondary">
              <span className="inline-flex min-w-0 items-center gap-0.5">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{formatSellerLocation(listing)}</span>
              </span>
              {distanceKm != null ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-subtle px-1.5 py-0.5 text-[9px] font-medium text-primary">
                  <Truck className="h-3 w-3" aria-hidden />
                  {t('home.kmAway', { km: distanceKm.toFixed(0) })}
                </span>
              ) : null}
            </div>

            <div
              className="rounded-[var(--radius-sm)] border border-dashed border-warning/60 bg-warning/10 px-2 py-1.5"
              data-testid={`ai-pick-expiry-${listing.id}`}
            >
              <p className="flex items-center gap-1 text-[11px] font-semibold text-warning">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('aiMatch.expiresInDays', { count: daysUntilExpiry })}
              </p>
              <p className="text-[10px] text-text-secondary">
                {t('aiMatch.expiryDate', { date: expiryDateLabel })}
              </p>
            </div>
          </div>
        </Link>

        <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-2.5 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[10px] text-text-secondary">
            {showAuthentic ? (
              <span className="inline-flex items-center gap-0.5 font-medium text-success">
                <Shield className="h-3 w-3" aria-hidden />
                {t('aiMatch.authentic')}
              </span>
            ) : null}
            {showFastDelivery ? (
              <span className="inline-flex items-center gap-0.5">
                <Truck className="h-3 w-3" aria-hidden />
                {t('aiMatch.fastDelivery')}
              </span>
            ) : null}
          </div>
          {phoneHref ? (
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 gap-1 rounded-full bg-primary px-3 text-[11px] text-white hover:bg-primary-hover"
              data-testid={`ai-pick-call-${listing.id}`}
              asChild
            >
              <a href={phoneHref} onClick={stopNav}>
                <Phone className="h-3.5 w-3.5" aria-hidden />
                {t('aiMatch.call')}
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <aside
        className="flex w-[30%] max-w-[7.5rem] min-w-[5.75rem] shrink-0 flex-col items-center justify-between bg-primary px-1.5 py-2 text-center text-white"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, color-mix(in srgb, white 12%, transparent) 1px, transparent 0)',
          backgroundSize: '8px 8px',
        }}
      >
        {hasDiscount ? (
          <div
            className="flex w-full items-center justify-center gap-0.5 rounded-[var(--radius-sm)] border border-dashed border-white/50 bg-warning px-1 py-1 text-[10px] font-bold leading-none"
            data-testid={`ai-pick-discount-${listing.id}`}
          >
            <Tag className="h-3 w-3 shrink-0" aria-hidden />
            {t('aiMatch.discountOff', { percent: listing.discountPercent })}
          </div>
        ) : (
          <div className="h-6 w-full" aria-hidden />
        )}

        <div className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1">
          <p className="text-[9px] font-medium uppercase tracking-wider text-primary-subtle/90">
            {t('aiMatch.stockLeft')}
          </p>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent/80 bg-primary-hover/80"
            data-testid={`ai-pick-stock-${listing.id}`}
          >
            <span className="text-xl font-bold tabular-nums text-accent">{listing.availableQty}</span>
          </div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-primary-subtle/90">{unitLabel}</p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 w-full gap-1 border-0 bg-white text-[11px] font-bold text-primary hover:bg-surface-raised"
          onClick={handleAddToCart}
          loading={addToCart.isAddingToCart(listing?.id)}
          disabled={!canAddToCart || addToCart.isAddingToCart(listing?.id)}
          data-testid={`ai-pick-add-to-cart-${listing.id}`}
        >
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('aiMatch.add')}
        </Button>
      </aside>
    </article>
  );
}
