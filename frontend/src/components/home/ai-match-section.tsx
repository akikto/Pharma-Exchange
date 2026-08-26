import { useTranslation } from 'react-i18next';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomeAiPickListingCard } from '@/components/home/home-ai-pick-listing-card';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useAiMatches } from '@/hooks/use-ai-matches';
import { formatMatchScore, matchScoreVariant } from '@/lib/ai-match-utils';
import { isRenderableListing } from '@/lib/catalog-groups';
import { cn } from '@/lib/utils';

interface AiMatchSectionProps {
  role?: 'buyer' | 'seller';
}

function matchBadgeClasses(variant: ReturnType<typeof matchScoreVariant>): string {
  if (variant === 'success') return 'bg-success/10 text-success';
  if (variant === 'warning') return 'bg-warning/10 text-warning';
  return 'bg-surface-sunken text-text-secondary';
}

export function AiMatchSection({ role = 'buyer' }: AiMatchSectionProps) {
  const { t } = useTranslation();
  const { data, isLoading, isFetching, refetch } = useAiMatches(role);
  const { coords } = useGeolocation();

  const matches = data?.data.filter((m) => isRenderableListing(m.listing)) ?? [];

  if (!isLoading && matches.length === 0) return null;

  return (
    <section data-testid="ai-match-section" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold flex items-center gap-2 text-text-primary">
            <Sparkles className="h-4 w-4 text-primary" />
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
              className="flex h-[7.5rem] w-full max-w-full min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-border-subtle"
              data-testid="ai-match-card-skeleton"
            >
              <div className="w-[70%] animate-pulse bg-surface-sunken" />
              <div className="w-[30%] animate-pulse bg-primary/40" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => {
            const listing = match.listing;
            if (!listing) return null;
            const scoreVariant = matchScoreVariant(match.score);
            return (
              <div key={match.id} data-testid="ai-match-card">
                <HomeAiPickListingCard
                  listing={listing}
                  userCoords={coords}
                  matchBadge={{
                    label: formatMatchScore(match.score),
                    className: matchBadgeClasses(scoreVariant),
                  }}
                  matchSummary={match.summary}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
