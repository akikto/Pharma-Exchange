import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomeAiPickListingCard } from '@/components/home/home-ai-pick-listing-card';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useAiMatches } from '@/hooks/use-ai-matches';
import { isRenderableListing } from '@/lib/catalog-groups';
import { sortAiPickMatchesByDistance } from '@/lib/ai-pick-card-utils';
import { sectionThemeShell } from '@/lib/section-theme';
import { cn } from '@/lib/utils';

interface AiMatchSectionProps {
  role?: 'buyer' | 'seller';
}

export function AiMatchSection({ role = 'buyer' }: AiMatchSectionProps) {
  const { t } = useTranslation();
  const { data, isLoading, isFetching, refetch } = useAiMatches(role);
  const { coords, requestLocation } = useGeolocation();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const matches = useMemo(() => {
    const renderable = data?.data.filter((m) => isRenderableListing(m.listing)) ?? [];
    return sortAiPickMatchesByDistance(renderable, coords);
  }, [coords, data?.data]);

  if (!isLoading && matches.length === 0) return null;

  return (
    <section data-testid="ai-match-section" className={cn('min-w-0 max-w-full space-y-3', sectionThemeShell('ai-pick'))}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold flex items-center gap-2 text-text-primary">
            <Sparkles className="h-4 w-4 text-ai-pick" />
            {t('aiMatch.title')}
          </h2>
          <p className="text-[10px] text-text-disabled">
            {data?.source === 'gemini' ? t('aiMatch.poweredByGemini') : t('aiMatch.poweredByRules')}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-text-secondary hover:text-text-primary"
          aria-label={t('aiMatch.refresh')}
          onClick={() => void refetch()}
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex h-[7.5rem] w-full max-w-full min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-ai-pick/20"
              data-testid="ai-match-card-skeleton"
            >
              <div className="w-[70%] animate-pulse bg-surface-sunken" />
              <div className="w-[30%] animate-pulse bg-ai-pick/30" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2" data-testid="ai-match-card-list">
          {matches.map((match) => {
            const listing = match.listing;
            if (!listing) return null;
            return (
              <div key={match.id} data-testid="ai-match-card">
                <HomeAiPickListingCard listing={listing} userCoords={coords} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
