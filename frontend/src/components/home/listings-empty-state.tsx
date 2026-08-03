import { SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface ListingsEmptyStateProps {
  onClearFilters?: () => void;
  showClearFilters?: boolean;
}

export function ListingsEmptyState({ onClearFilters, showClearFilters }: ListingsEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-subtle bg-surface-raised px-4 py-8 text-center"
      data-testid="listings-empty-state"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken text-text-secondary">
        <SearchX className="h-7 w-7" aria-hidden />
      </div>
      <p className="font-medium text-text-primary">{t('home.emptyListingsTitle')}</p>
      <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-text-secondary">
        {t('home.emptyListingsHint')}
      </p>
      {showClearFilters && onClearFilters && (
        <Button type="button" variant="secondary" size="sm" className="mt-5" onClick={onClearFilters}>
          {t('home.clearFilters')}
        </Button>
      )}
    </div>
  );
}
