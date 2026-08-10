import { useTranslation } from 'react-i18next';
import type { Medicine } from '@/types';

type MedicineInfoPanelProps = {
  medicine: Medicine;
  className?: string;
};

export function MedicineInfoPanel({ medicine, className = '' }: MedicineInfoPanelProps) {
  const { t } = useTranslation();

  const rows = [
    { label: t('admin.medicines.fields.genericName'), value: medicine.genericName },
    { label: t('admin.medicines.fields.composition'), value: medicine.composition },
    { label: t('admin.medicines.fields.strength'), value: medicine.strength },
    { label: t('admin.medicines.fields.dosageForm'), value: medicine.dosageForm },
    { label: t('admin.medicines.fields.packSize'), value: medicine.packSize },
    { label: t('admin.medicines.fields.company'), value: medicine.company },
    { label: t('admin.medicines.fields.category'), value: medicine.category },
  ].filter((row) => row.value);

  if (rows.length === 0) return null;

  return (
    <div
      className={`rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-3 space-y-2 min-w-0 ${className}`}
      data-testid="medicine-info-panel"
    >
      <p className="text-xs font-medium text-text-secondary">{t('listing.medicineDetails')}</p>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-[10px] uppercase tracking-wide text-text-disabled">{row.label}</dt>
            <dd className="text-sm break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
