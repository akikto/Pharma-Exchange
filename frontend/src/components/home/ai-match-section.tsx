import { useTranslation } from 'react-i18next';
import { RefreshCw, Sparkles, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAiMatches } from '@/hooks/use-ai-matches';
import { useAddToCart } from '@/hooks/use-api';
import { formatPrice, cn } from '@/lib/utils';
import { formatMatchScore, matchScoreVariant } from '@/lib/ai-match-utils';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface AiMatchSectionProps {
  role?: 'buyer' | 'seller';
}

export function AiMatchSection({ role = 'buyer' }: AiMatchSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data, isLoading, isFetching, refetch } = useAiMatches(role);
  const addToCart = useAddToCart();

  const matches = data?.data.filter((m) => m.listing) ?? [];

  if (!isLoading && matches.length === 0) return null;

  const handleAddToCart = (listingId: string, moq: number) => {
    addToCart.mutate(
      { listingId, quantity: moq },
      {
        onSuccess: () => toast({ description: t('aiMatch.addedToCart') }),
        onError: () => toast({ title: t('toast.error'), description: t('search.addToCartError'), variant: 'destructive' }),
      },
    );
  };

  return (
    <section data-testid="ai-match-section" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
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
          aria-label={t('aiMatch.refresh')}
          onClick={() => void refetch()}
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 rounded-[var(--radius-md)] bg-surface-sunken animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => {
            const listing = match.listing!;
            const scoreVariant = matchScoreVariant(match.score);
            return (
              <div
                key={match.id}
                className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-3 space-y-2"
                data-testid="ai-match-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/medicine/${listing.id}`} className="font-medium text-sm hover:text-primary line-clamp-1">
                      {listing.medicine.name}
                    </Link>
                    <p className="text-xs text-text-secondary">{listing.pharmacy.name}</p>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                      scoreVariant === 'success' && 'bg-success/10 text-success',
                      scoreVariant === 'warning' && 'bg-warning/10 text-warning',
                      scoreVariant === 'default' && 'bg-surface-sunken text-text-secondary',
                    )}
                  >
                    {formatMatchScore(match.score)}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{match.summary}</p>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold tabular-nums">{formatPrice(listing.finalPrice)}</p>
                    {match.contextLabel && (
                      <p className="text-[10px] text-text-disabled">{match.contextLabel}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(listing.id, listing.moq)}
                    loading={addToCart.isPending}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    {t('aiMatch.addToCart')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
