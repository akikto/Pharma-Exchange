import { OfferCard } from '@/components/offers/offer-card';
import { isRenderableListing } from '@/lib/catalog-groups';
import { warnInvalidListing } from '@/lib/listing-debug';
import type { ListingCardTone } from '@/lib/listing-card-tone';
import type { Listing } from '@/types';

export type { ListingCardTone } from '@/lib/listing-card-tone';

export interface ListingCardProps {
  listing: Listing;
  className?: string;
  showActions?: boolean;
  showAddToCart?: boolean;
  bestPrice?: number;
  variant?: 'grid' | 'list' | 'featured';
  tone?: ListingCardTone;
  userCoords?: { latitude: number; longitude: number } | null;
  matchBadge?: { label: string; className: string };
  matchSummary?: string;
}

/** Canonical marketplace listing card (grid, featured rail, list, compare). */
export function ListingCard({
  listing,
  className,
  showActions = false,
  showAddToCart = false,
  bestPrice,
  variant = 'grid',
  tone,
  userCoords,
  matchBadge,
  matchSummary,
}: ListingCardProps) {
  if (!isRenderableListing(listing)) {
    warnInvalidListing('listing-card:render', { listing });
    return null;
  }

  return (
    <div data-testid={`listing-card-${listing.id}`}>
      <OfferCard
        listing={listing}
        className={className}
        variant={variant}
        tone={tone}
        showActions={showActions}
        showAddToCart={showAddToCart}
        bestPrice={bestPrice}
        userCoords={userCoords}
        matchBadge={matchBadge}
        matchSummary={matchSummary}
      />
    </div>
  );
}

/** @deprecated Use ListingCard — kept for legacy imports in tests. */
export { OfferCard } from '@/components/offers/offer-card';
