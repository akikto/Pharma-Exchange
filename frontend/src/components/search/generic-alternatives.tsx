import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMedicineAlternatives } from '@/hooks/use-medicine-suggestions';
import type { Medicine } from '@/types';

interface GenericAlternativesProps {
  medicine?: Medicine | null;
}

export function GenericAlternatives({ medicine }: GenericAlternativesProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useMedicineAlternatives(medicine?.id);

  if (!medicine?.genericName || isLoading) return null;
  if (!data?.data?.length) return null;

  return (
    <section className="px-4 py-3 border-b border-border-subtle bg-surface-raised" data-testid="generic-alternatives">
      <h3 className="text-sm font-semibold">{t('search.genericAlternatives')}</h3>
      <p className="text-xs text-text-secondary mb-2">
        {t('search.genericAlternativesHint', { generic: medicine.genericName })}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {data.data.map((alt) => (
          <Link
            key={alt.id}
            to={`/search?q=${encodeURIComponent(alt.name)}`}
            className="shrink-0 rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 py-2 text-xs hover:border-primary"
          >
            <span className="font-medium block">{alt.name}</span>
            <span className="text-text-secondary">{alt.company}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
