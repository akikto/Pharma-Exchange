import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { CatalogGroup } from '@/lib/catalog-groups';
import { cn } from '@/lib/utils';

interface CatalogGroupCardProps {
  group: CatalogGroup;
  className?: string;
}

export function CatalogGroupCard({ group, className }: CatalogGroupCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/medicine/${group.medicineId}/compare`}
      data-testid={`catalog-group-${group.medicineId}`}
      className={cn(
        'block w-full text-left rounded-[var(--radius-md)] border border-border-subtle bg-surface-base p-3',
        'transition-shadow hover:shadow-md active:scale-[0.99]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2">{group.medicineName}</h3>
          <p className="text-xs text-text-secondary mt-0.5">{group.packSize} · {group.company}</p>
          <p className="text-xs text-text-secondary flex items-center gap-1 mt-2">
            <Users className="h-3 w-3" />
            {t('home.sellerCount', { count: group.sellerCount })}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-text-disabled shrink-0 mt-1" />
      </div>
      <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-border-subtle">
        <span className="text-xs text-text-secondary">{t('home.bestPrice')}</span>
        <span className="text-lg font-bold tabular-nums text-primary">{formatPrice(group.bestPrice)}</span>
      </div>
      {group.sellerCount > 1 && (
        <p className="text-[10px] text-primary mt-1">{t('home.compareOffers')}</p>
      )}
    </Link>
  );
}
