import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Heart, GitCompare, Clock } from 'lucide-react';
import { formatPrice, getExpiryStatus, getExpiryLabel, cn } from '@/lib/utils';
import { StatusChip } from '@/components/ui/status-chip';
import { Button } from '@/components/ui/button';
import { useAddToCart } from '@/hooks/use-api';
import { useWatchlistStore } from '@/stores/watchlist-store';
import { useShellStore } from '@/stores/shell-store';
import { useToast } from '@/hooks/use-toast';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  className?: string;
  showActions?: boolean;
}

export function ListingCard({ listing, className, showActions = false }: ListingCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const { toggle, has } = useWatchlistStore();
  const openModal = useShellStore((s) => s.openModal);
  const expiryStatus = getExpiryStatus(listing.expiryDate);
  const hasDiscount = listing.discountPercent > 0;
  const watched = has(listing.medicine.id);

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

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(listing.medicine.id);
    toast({ title: watched ? t('search.removedWatchlist') : t('search.addedWatchlist') });
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openModal('comparison');
  };

  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-border-subtle bg-surface-base overflow-hidden',
        'transition-shadow hover:shadow-md',
        className,
      )}
    >
      <Link
        to={`/medicine/${listing.id}`}
        className="block active:scale-[0.98] transition-transform"
      >
        <div className="relative aspect-square bg-surface-sunken">
          {listing.imageUrl ? (
            <img src={listing.imageUrl} alt={listing.medicine.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-text-disabled text-4xl">💊</div>
          )}
          {hasDiscount && (
            <span className="absolute top-2 right-2 rounded-full bg-danger px-2 py-0.5 text-xs font-medium text-white">
              -{listing.discountPercent}%
            </span>
          )}
        </div>
        <div className="p-3 space-y-1">
          <h3 className="font-semibold text-sm line-clamp-2">{listing.medicine.name}</h3>
          <p className="text-xs text-text-secondary">{listing.medicine.packSize} · {listing.medicine.company}</p>
          <p className="text-xs text-text-secondary">⭐ {listing.pharmacy.rating} {listing.pharmacy.name}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tabular-nums text-primary">{formatPrice(listing.finalPrice)}</span>
            {hasDiscount && (
              <span className="text-xs text-text-disabled line-through tabular-nums">{formatPrice(listing.sellingPrice)}</span>
            )}
          </div>
          <p className="text-xs text-text-secondary">MOQ {listing.moq} · {listing.availableQty} available</p>
          <StatusChip
            label={`Expiry: ${getExpiryLabel(listing.expiryDate)}`}
            variant={expiryStatus === 'safe' ? 'success' : expiryStatus}
            icon={Clock}
          />
        </div>
      </Link>
      {showActions && (
        <div className="flex gap-1 p-2 pt-0 border-t border-border-subtle">
          <Button variant="secondary" size="sm" className="flex-1 h-8 text-xs" onClick={handleAddToCart} loading={addToCart.isPending}>
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            {t('listing.addToCart')}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('search.watchlist')} onClick={handleWatchlist}>
            <Heart className={cn('h-4 w-4', watched && 'fill-primary text-primary')} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('search.compare')} onClick={handleCompare}>
            <GitCompare className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
