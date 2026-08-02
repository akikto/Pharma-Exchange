import { Link } from 'react-router-dom';
import { formatPrice, getExpiryStatus, getExpiryLabel, cn } from '@/lib/utils';
import { StatusChip } from '@/components/ui/status-chip';
import { Clock } from 'lucide-react';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

export function ListingCard({ listing, className }: ListingCardProps) {
  const expiryStatus = getExpiryStatus(listing.expiryDate);
  const hasDiscount = listing.discountPercent > 0;

  return (
    <Link
      to={`/medicine/${listing.id}`}
      className={cn(
        'block rounded-[var(--radius-md)] border border-border-subtle bg-surface-base overflow-hidden',
        'transition-shadow hover:shadow-md active:scale-[0.98]',
        className
      )}
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
  );
}
