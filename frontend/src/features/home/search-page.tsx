import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ListingCard } from '@/components/listing-card';
import { ListingCardSkeleton } from '@/components/ui/skeleton';
import { useListings } from '@/hooks/use-listings';
import { useInfiniteScroll } from '@/hooks/use-chat';
import { useCallback } from 'react';

export function SearchPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    q: params.get('q') || undefined,
    category: params.get('category') || undefined,
    city: params.get('city') || undefined,
    minDiscount: params.get('minDiscount') || undefined,
    sortBy: params.get('sortBy') || 'createdAt',
  };

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = useListings(filters);
  const listings = data?.pages.flatMap((p) => p.data) ?? [];

  const loadMore = useCallback(() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const scrollRef = useInfiniteScroll(loadMore, !!hasNextPage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams(params);
    if (query) p.set('q', query); else p.delete('q');
    setParams(p);
  };

  return (
    <div>
      <TopBar title={t('search.title')} showBack />
      <div className="sticky top-14 z-30 bg-surface-base px-4 py-3 border-b border-border-subtle">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input className="pl-9" placeholder={t('search.placeholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button type="button" variant="secondary" size="icon" aria-label={t('search.filters')} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </form>

        {showFilters && (
          <div className="mt-3 p-3 rounded-[var(--radius-md)] border border-border-subtle space-y-3">
            <Input placeholder={t('search.city')} defaultValue={params.get('city') || ''} onBlur={(e) => { const p = new URLSearchParams(params); if (e.target.value) p.set('city', e.target.value); else p.delete('city'); setParams(p); }} />
            <Input placeholder={t('search.minDiscount')} type="number" defaultValue={params.get('minDiscount') || ''} onBlur={(e) => { const p = new URLSearchParams(params); if (e.target.value) p.set('minDiscount', e.target.value); else p.delete('minDiscount'); setParams(p); }} />
            <select className="w-full h-10 rounded-[var(--radius-md)] border border-border-subtle px-3 text-sm bg-surface-base" value={params.get('sortBy') || 'createdAt'} onChange={(e) => { const p = new URLSearchParams(params); p.set('sortBy', e.target.value); setParams(p); }}>
              <option value="createdAt">{t('search.sortNewest')}</option>
              <option value="price">{t('search.sortPrice')}</option>
              <option value="expiry">{t('search.sortExpiry')}</option>
              <option value="discount">{t('search.sortDiscount')}</option>
            </select>
          </div>
        )}
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <p>{t('search.noResults')}</p>
            <p className="text-sm mt-1">{t('search.noResultsHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </div>
    </div>
  );
}
