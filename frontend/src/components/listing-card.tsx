import { OfferCard } from '@/components/offers/offer-card';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  className?: string;
  showActions?: boolean;
  bestPrice?: number;
}

/** Grid marketplace card — delegates to OfferCard. */
export function ListingCard({ listing, className, showActions = false, bestPrice }: ListingCardProps) {
  return (
    <OfferCard
      listing={listing}
      className={className}
      variant="grid"
      showActions={showActions}
      bestPrice={bestPrice}
    />
  );
}
