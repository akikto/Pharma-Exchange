import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, MessageCircle } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { Skeleton } from '@/components/ui/skeleton';
import { ListingCard } from '@/components/listing-card';
import { apiClient } from '@/lib/api';
import { formatPrice, getExpiryStatus, getExpiryLabel } from '@/lib/utils';
import { useAddToCart, useStartConversation } from '@/hooks/use-api';
import { useListings } from '@/hooks/use-listings';
import type { Listing } from '@/types';

export function MedicineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddToCart();
  const startChat = useStartConversation();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => apiClient.get<Listing>(`/listings/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-4"><Skeleton className="aspect-square w-full" /><Skeleton className="h-8 w-2/3 mt-4" /></div>;
  if (!listing) return <div className="p-4 text-center text-text-secondary">Listing not found</div>;

  const expiryStatus = getExpiryStatus(listing.expiryDate);

  const handleAddToCart = () => {
    addToCart.mutate({ listingId: listing.id, quantity });
  };

  const handleChat = async () => {
    const userId = listing.pharmacy.userId;
    if (!userId) return;
    const conv = await startChat.mutateAsync({ participantId: userId, listingId: listing.id });
    navigate(`/chat/${conv.id}`);
  };

  return (
    <div className="pb-24">
      <TopBar showBack />
      <div className="aspect-square bg-surface-sunken">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.medicine.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">💊</div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-xl font-bold">{listing.medicine.name}</h1>
          <p className="text-text-secondary">{listing.medicine.packSize} · {listing.medicine.company}</p>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold tabular-nums text-primary">{formatPrice(listing.finalPrice)}</span>
          {listing.discountPercent > 0 && (
            <span className="text-text-disabled line-through tabular-nums">{formatPrice(listing.sellingPrice)}</span>
          )}
        </div>

        <p className="text-sm text-text-secondary">MOQ {listing.moq} · {listing.availableQty} available</p>
        <StatusChip label={`Expiry: ${getExpiryLabel(listing.expiryDate)}`} variant={expiryStatus === 'safe' ? 'success' : expiryStatus} />

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
            <h3 className="font-semibold text-sm mb-1">Composition</h3>
            <p className="text-sm text-text-secondary">{listing.medicine.composition}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-surface-base border-t border-border-subtle safe-bottom flex gap-3 items-center">
        <div className="flex items-center gap-2 border border-border-subtle rounded-[var(--radius-md)]">
          <button className="p-2" onClick={() => setQuantity(Math.max(listing.moq, quantity - 1))}><Minus className="h-4 w-4" /></button>
          <span className="w-8 text-center tabular-nums font-medium">{quantity}</span>
          <button className="p-2" onClick={() => setQuantity(Math.min(listing.availableQty, quantity + 1))}><Plus className="h-4 w-4" /></button>
        </div>
        <Button className="flex-1" onClick={handleAddToCart} loading={addToCart.isPending}>Add to Cart</Button>
        <Button variant="secondary" size="icon" aria-label="Message seller" onClick={handleChat}><MessageCircle className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}

export function PharmacyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: pharmacy, isLoading } = useQuery({
    queryKey: ['pharmacy', id],
    queryFn: () => apiClient.get<{ id: string; name: string; city: string; rating: number }>(`/pharmacies/${id}`),
    enabled: !!id,
  });
  const { data: listingsData, isLoading: listingsLoading } = useListings({ pharmacyId: id });
  const listings = listingsData?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) return <div className="p-4"><Skeleton className="h-24 w-full" /></div>;

  return (
    <div>
      <TopBar showBack />
      <div className="p-4 space-y-4">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-primary-subtle flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-2">
            {pharmacy?.name?.[0]}
          </div>
          <h1 className="text-xl font-bold">{pharmacy?.name}</h1>
          <p className="text-text-secondary">⭐ {pharmacy?.rating} · {pharmacy?.city}</p>
        </div>
        <h2 className="font-semibold">Listings</h2>
        {listingsLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : listings.length === 0 ? (
          <p className="text-text-secondary text-sm">No active listings</p>
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

