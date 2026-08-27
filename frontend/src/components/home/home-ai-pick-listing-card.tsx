import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Store,
  MapPin,
  Truck,
  Clock,
  ShoppingCart,
  Tag,
  CircleCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getListingCompositionText } from '@/lib/listing-utils';
import { debugListingAction, warnInvalidListing } from '@/lib/listing-debug';
import {
  formatGenericStrengthLine,
  formatAiPickExpiryDate,
  formatSellerLocation,
  getDaysUntilExpiry,
  resolveAiPickDistanceKm,
} from '@/lib/ai-pick-card-utils';
import { formatDistanceKmLabel } from '@/lib/listing-detail-display';
import { useAddToCart } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import type { Listing } from '@/types';

export interface HomeAiPickListingCardProps {
  listing: Listing;
  userCoords?: { latitude: number; longitude: number } | null;
  className?: string;
}

export function HomeAiPickListingCard({
  listing,
  userCoords,
  className,
}: HomeAiPickListingCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const addToCart = useAddToCart();

  const verified = listing.pharmacy.verificationStatus === 'APPROVED';
  const hasDiscount = listing.discountPercent > 0;
  const compositionText = getListingCompositionText(listing);
  const genericLine = formatGenericStrengthLine(listing, compositionText);
  const distanceKm = resolveAiPickDistanceKm(listing, userCoords);
  const daysUntilExpiry = getDaysUntilExpiry(listing.expiryDate);
  const expiryDateLabel = formatAiPickExpiryDate(listing.expiryDate);
  const canAddToCart = listing.status === 'ACTIVE' && listing.availableQty >= listing.moq;
  const detailsPath = `/medicine/${listing.id}`;

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

  return (
    <article
      className={cn(
        'flex w-full max-w-full min-w-0 flex-row items-stretch overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-surface-base shadow-elevation-1',
        className,
      )}
      data-testid={`ai-pick-listing-card-${listing.id}`}
      data-ai-pick-layout="horizontal"
    >
      <Link
        to={detailsPath}
        className="flex w-[70%] max-w-[70%] min-w-0 basis-[70%] flex-col border-r border-border-subtle p-2.5 active:scale-[0.995] transition-transform"
        data-testid={`ai-pick-card-link-${listing.id}`}
      >
        <div className="space-y-1 min-w-0">
          <h3 className="text-sm font-bold leading-snug text-text-primary break-words">
            {listing.medicine.name}
          </h3>

          {(genericLine || listing.medicine.dosageForm) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {genericLine ? (
                <p className="text-[11px] leading-snug text-text-secondary break-words">{genericLine}</p>
              ) : null}
              {listing.medicine.dosageForm ? (
                <span className="inline-flex shrink-0 rounded-full bg-primary-subtle px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                  {listing.medicine.dosageForm}
                </span>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-text-primary min-w-0">
            <Store className="h-3 w-3 shrink-0 text-primary" aria-hidden />
            <span className="break-words">{listing.pharmacy.name}</span>
            {verified ? (
              <CircleCheck className="h-3.5 w-3.5 shrink-0 text-success" aria-label={t('home.verified')} />
            ) : null}
          </div>

          <p
            className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[10px] text-text-secondary min-w-0 break-words"
            data-testid={`ai-pick-location-line-${listing.id}`}
          >
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span>{formatSellerLocation(listing)}</span>
            {distanceKm != null ? (
              <>
                <span className="text-text-disabled" aria-hidden>
                  ·
                </span>
                <span className="inline-flex items-center gap-0.5 font-medium text-primary">
                  <Truck className="h-3 w-3 shrink-0" aria-hidden />
                  {t('home.kmAway', { km: formatDistanceKmLabel(distanceKm) })}
                </span>
              </>
            ) : null}
          </p>

          <div
            className="rounded-[var(--radius-sm)] border border-dashed border-warning/70 bg-warning/10 px-2 py-1"
            data-testid={`ai-pick-expiry-${listing.id}`}
          >
            <p className="flex items-center gap-1 text-[11px] font-semibold text-warning">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('aiMatch.expiresInDays', { count: daysUntilExpiry })}
            </p>
            <p className="text-[10px] text-text-secondary break-words">
              {t('aiMatch.expiryDate', { date: expiryDateLabel })}
            </p>
          </div>
        </div>
      </Link>

      <aside
        className="flex w-[30%] max-w-[30%] min-w-[5.5rem] shrink-0 basis-[30%] flex-col items-center justify-between bg-primary px-1.5 py-1.5 text-center text-white"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, color-mix(in srgb, white 12%, transparent) 1px, transparent 0)',
          backgroundSize: '8px 8px',
        }}
      >
        {hasDiscount ? (
          <div
            className="flex w-full items-center justify-center gap-0.5 rounded-[var(--radius-sm)] border border-dashed border-white/60 bg-warning px-1 py-0.5 text-[10px] font-bold leading-none text-white"
            data-testid={`ai-pick-discount-${listing.id}`}
          >
            <Tag className="h-3 w-3 shrink-0" aria-hidden />
            {t('aiMatch.discountOff', { percent: listing.discountPercent })}
          </div>
        ) : (
          <div className="h-4 w-full" aria-hidden />
        )}

        <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
          <p className="text-[9px] font-medium uppercase tracking-wider text-white/80">
            {t('aiMatch.stockLeft')}
          </p>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-accent bg-primary-hover/90"
            data-testid={`ai-pick-stock-${listing.id}`}
          >
            <span className="text-base font-bold tabular-nums text-accent">{listing.availableQty}</span>
          </div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-white/80">{t('aiMatch.units')}</p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 w-full gap-1 border-0 bg-white text-[10px] font-bold text-primary hover:bg-surface-raised"
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
