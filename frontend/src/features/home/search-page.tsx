import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, X } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { ListingCard } from '@/components/listing-card';
import { ListingCardSkeleton } from '@/components/ui/skeleton';
import { SearchInput } from '@/components/search/search-input';
import { TherapeuticCategoryChips, DosageFormChips } from '@/components/search/filter-chips';
import { AdvancedFiltersSheet, type AdvancedFilterValues } from '@/components/search/advanced-filters-sheet';
import { SortSelect } from '@/components/search/sort-select';
import { GenericAlternatives } from '@/components/search/generic-alternatives';
import { useListings } from '@/hooks/use-listings';
import { useInfiniteScroll } from '@/hooks/use-chat';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useMedicineSuggestions } from '@/hooks/use-medicine-suggestions';
import {
  paramsFromSearchParams,
  countActiveFilters,
  clearAllFilters,
  setParam,
} from '@/lib/search-params';
import type { Medicine } from '@/types';
import { isRenderableListing } from '@/lib/catalog-groups';

export function SearchPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { coords, requestLocation } = useGeolocation();

  const filters = useMemo(() => paramsFromSearchParams(params), [params]);
  const activeFilterCount = countActiveFilters(params);

  const listingFilters = useMemo(() => {
    const base = { ...filters };
    if (filters.radiusKm && coords) {
      base.latitude = String(coords.latitude);
      base.longitude = String(coords.longitude);
    }
    return base;
  }, [filters, coords]);

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = useListings(listingFilters);
  const listings = (data?.pages.flatMap((p) => p.data) ?? []).filter(isRenderableListing);

  const { data: suggestionMatch } = useMedicineSuggestions(query, Boolean(query.trim()));
  const topMedicine = suggestionMatch?.data?.[0] ?? null;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const scrollRef = useInfiniteScroll(loadMore, !!hasNextPage);

  const updateParams = (next: URLSearchParams) => setParams(next);

  const applySearch = (q: string) => {
    const next = new URLSearchParams(params);
    if (q) next.set('q', q);
    else next.delete('q');
    updateParams(next);
  };

  const handleSelectSuggestion = (medicine: Medicine) => {
    const next = setParam(params, 'q', medicine.name);
    updateParams(next);
  };

  const advancedValues: AdvancedFilterValues = {
    maxPrice: params.get('maxPrice') ?? undefined,
    minRating: params.get('minRating') ?? undefined,
    radiusKm: params.get('radiusKm') ?? undefined,
    verifiedOnly: params.get('verifiedOnly') === 'true',
    inStockOnly: params.get('inStockOnly') === 'true',
    city: params.get('city') ?? undefined,
    minDiscount: params.get('minDiscount') ?? undefined,
  };

  const applyAdvanced = (values: AdvancedFilterValues) => {
    let next = new URLSearchParams(params);
    const entries: [string, string | undefined][] = [
      ['maxPrice', values.maxPrice],
      ['minRating', values.minRating],
      ['radiusKm', values.radiusKm],
      ['city', values.city],
      ['minDiscount', values.minDiscount],
      ['verifiedOnly', values.verifiedOnly ? 'true' : undefined],
      ['inStockOnly', values.inStockOnly ? 'true' : undefined],
    ];
    for (const [key, val] of entries) {
      next = setParam(next, key, val);
    }
    if (values.radiusKm && !coords) requestLocation();
    updateParams(next);
  };

  const handleClearAll = () => {
    updateParams(clearAllFilters(params));
    setQuery(params.get('q') || '');
  };

  return (
    <div>
      <TopBar title={t('search.title')} showBack />
      <div className="sticky top-14 z-30 bg-surface-base px-4 py-3 border-b border-border-subtle space-y-3">
        <div className="flex gap-2 items-start">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSubmit={applySearch}
            onSelectSuggestion={handleSelectSuggestion}
          />
          <div className="relative">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={t('search.filters')}
              onClick={() => setShowFilters(!showFilters)}
              data-testid="filter-toggle"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            {activeFilterCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-white"
                data-testid="filter-badge"
              >
                {activeFilterCount}
              </span>
            )}
          </div>
        </div>

        <TherapeuticCategoryChips
          category={params.get('category') ?? undefined}
          onCategoryChange={(value) => updateParams(setParam(params, 'category', value))}
        />
        <DosageFormChips
          dosageForm={params.get('dosageForm') ?? undefined}
          onDosageFormChange={(value) => updateParams(setParam(params, 'dosageForm', value))}
        />

        {showFilters && (
          <div className="p-3 rounded-[var(--radius-md)] border border-border-subtle space-y-3">
            <SortSelect
              sortBy={params.get('sortBy') || 'recommended'}
              sortOrder={params.get('sortOrder') || 'desc'}
              onChange={(sortBy, sortOrder) => {
                let next = setParam(params, 'sortBy', sortBy);
                next = setParam(next, 'sortOrder', sortOrder);
                updateParams(next);
              }}
            />
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setAdvancedOpen(true)}>
                {t('search.advancedFilters')}
              </Button>
              {activeFilterCount > 0 && (
                <Button variant="ghost" onClick={handleClearAll} className="text-primary">
                  <X className="h-4 w-4 mr-1" />
                  {t('search.clearAll')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <GenericAlternatives medicine={topMedicine} />

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
            {listings.map((l) => <ListingCard key={l.id} listing={l} showActions />)}
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </div>

      <AdvancedFiltersSheet
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        values={advancedValues}
        onApply={applyAdvanced}
      />
    </div>
  );
}
