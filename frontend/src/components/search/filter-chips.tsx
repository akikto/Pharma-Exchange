import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { DOSAGE_FORMS, THERAPEUTIC_CATEGORIES } from '@/lib/search-constants';

interface FilterChipsProps {
  category?: string;
  dosageForm?: string;
  onCategoryChange: (value?: string) => void;
  onDosageFormChange: (value?: string) => void;
}

export function TherapeuticCategoryChips({ category, onCategoryChange }: Pick<FilterChipsProps, 'category' | 'onCategoryChange'>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5" data-testid="therapeutic-chips">
      <p className="text-xs text-text-secondary px-1">{t('search.therapeuticCategories')}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {THERAPEUTIC_CATEGORIES.map((item) => (
          <button
            key={item.key}
            type="button"
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs transition-colors',
              category === item.value
                ? 'border-primary bg-primary-subtle text-primary font-medium'
                : 'border-border-subtle hover:bg-primary-subtle hover:border-primary hover:text-primary',
            )}
            onClick={() => onCategoryChange(category === item.value ? undefined : item.value)}
          >
            {t(`search.therapeutic.${item.key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DosageFormChips({ dosageForm, onDosageFormChange }: Pick<FilterChipsProps, 'dosageForm' | 'onDosageFormChange'>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5" data-testid="dosage-chips">
      <p className="text-xs text-text-secondary px-1">{t('search.dosageForms')}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {DOSAGE_FORMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs transition-colors',
              dosageForm === item.value
                ? 'border-primary bg-primary-subtle text-primary font-medium'
                : 'border-border-subtle hover:bg-primary-subtle hover:border-primary hover:text-primary',
            )}
            onClick={() => onDosageFormChange(dosageForm === item.value ? undefined : item.value)}
          >
            {t(`search.dosage.${item.key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
