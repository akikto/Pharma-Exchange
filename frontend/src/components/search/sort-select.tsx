import { useTranslation } from 'react-i18next';
import { SORT_OPTIONS } from '@/lib/search-constants';

interface SortSelectProps {
  sortBy: string;
  sortOrder: string;
  onChange: (sortBy: string, sortOrder: string) => void;
}

export function SortSelect({ sortBy, sortOrder, onChange }: SortSelectProps) {
  const { t } = useTranslation();
  const current = `${sortBy}:${sortOrder}`;

  return (
    <select
      className="w-full h-10 rounded-[var(--radius-md)] border border-border-subtle px-3 text-sm bg-surface-base"
      value={current}
      onChange={(e) => {
        const [by, order] = e.target.value.split(':');
        onChange(by, order);
      }}
      aria-label={t('search.sortBy')}
      data-testid="sort-select"
    >
      {SORT_OPTIONS.map((opt) => {
        const val = `${opt.value}:${opt.order}`;
        const key =
          opt.value === 'price' && opt.order === 'asc' ? 'sortPriceAsc'
          : opt.value === 'price' && opt.order === 'desc' ? 'sortPriceDesc'
          : `sort${opt.value.charAt(0).toUpperCase()}${opt.value.slice(1)}`;
        return (
          <option key={val} value={val}>
            {t(`search.${key}`)}
          </option>
        );
      })}
    </select>
  );
}
