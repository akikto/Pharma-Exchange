import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MedicineImageUpload } from '@/components/medicine/medicine-image-upload';
import { MedicineNameAutocomplete } from '@/components/medicine/medicine-name-autocomplete';
import { MEDICINE_DOSAGE_FORMS } from '@/lib/medicine-constants';
import type { MedicineFormErrors, MedicineFormValues, MedicineRecord } from '@/lib/medicine-form';

type MedicineFormFieldsProps = {
  mode: 'create' | 'edit';
  form: MedicineFormValues;
  errors: MedicineFormErrors;
  onFieldChange: <K extends keyof MedicineFormValues>(key: K, value: MedicineFormValues[K]) => void;
  onMedicineAutofill?: (medicine: MedicineRecord) => void;
  onExistingMedicineSelect?: (medicine: MedicineRecord) => void;
  nameInputTestId?: string;
};

export function MedicineFormFields({
  mode,
  form,
  errors,
  onFieldChange,
  onMedicineAutofill,
  onExistingMedicineSelect,
  nameInputTestId = 'medicine-name',
}: MedicineFormFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {mode === 'create' ? (
          <div className="sm:col-span-2">
            <MedicineNameAutocomplete
              label={`${t('admin.medicines.fields.name')} *`}
              value={form.name}
              placeholder={t('admin.medicines.fields.name')}
              onValueChange={(value) => onFieldChange('name', value)}
              onMedicineSelect={onMedicineAutofill ?? (() => undefined)}
              onExistingMedicineSelect={onExistingMedicineSelect}
              inputTestId={nameInputTestId}
            />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>
        ) : (
          <Field
            id="medicine-name"
            label={t('admin.medicines.fields.name')}
            required
            value={form.name}
            error={errors.name}
            onChange={(value) => onFieldChange('name', value)}
          />
        )}
        <Field
          id="medicine-company"
          label={t('admin.medicines.fields.company')}
          required
          value={form.company}
          error={errors.company}
          onChange={(value) => onFieldChange('company', value)}
        />
        <div>
          <Label htmlFor="medicine-dosage-form">{t('admin.medicines.fields.dosageForm')} *</Label>
          <select
            id="medicine-dosage-form"
            data-testid="medicine-dosage-form"
            className="mt-1 flex h-10 w-full rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 text-sm"
            value={form.dosageForm}
            onChange={(event) => onFieldChange('dosageForm', event.target.value as MedicineFormValues['dosageForm'])}
          >
            <option value="">{t('admin.medicines.selectDosageForm')}</option>
            {MEDICINE_DOSAGE_FORMS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.dosageForm && <p className="mt-1 text-xs text-danger">{errors.dosageForm}</p>}
        </div>
        <Field
          id="medicine-pack-size"
          label={t('admin.medicines.fields.packSize')}
          required
          value={form.packSize}
          error={errors.packSize}
          onChange={(value) => onFieldChange('packSize', value)}
        />
        <Field
          id="medicine-category"
          label={t('admin.medicines.fields.category')}
          required
          value={form.category}
          error={errors.category}
          onChange={(value) => onFieldChange('category', value)}
        />
        <Field
          id="medicine-strength"
          label={t('admin.medicines.fields.strength')}
          value={form.strength}
          error={errors.strength}
          onChange={(value) => onFieldChange('strength', value)}
        />
        <Field
          id="medicine-generic-name"
          label={t('admin.medicines.fields.genericName')}
          value={form.genericName}
          error={errors.genericName}
          onChange={(value) => onFieldChange('genericName', value)}
        />
        <Field
          id="medicine-brand-name"
          label={t('admin.medicines.fields.brandName')}
          value={form.brandName}
          error={errors.brandName}
          onChange={(value) => onFieldChange('brandName', value)}
        />
        <Field
          id="medicine-schedule-class"
          label={t('admin.medicines.fields.scheduleClass')}
          value={form.scheduleClass}
          error={errors.scheduleClass}
          onChange={(value) => onFieldChange('scheduleClass', value)}
        />
        <div className="sm:col-span-2">
          <MedicineImageUpload
            label={t('admin.medicines.fields.imageUrl')}
            value={form.imageUrl}
            error={errors.imageUrl}
            onChange={(value) => onFieldChange('imageUrl', value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="medicine-composition">{t('admin.medicines.fields.composition')}</Label>
        <textarea
          id="medicine-composition"
          className="mt-1 w-full min-h-[80px] rounded-[var(--radius-md)] border border-border-subtle px-3 py-2 text-sm bg-surface-base"
          value={form.composition}
          onChange={(event) => onFieldChange('composition', event.target.value)}
        />
      </div>
    </>
  );
}

function Field({
  id,
  label,
  value,
  error,
  required,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}{required ? ' *' : ''}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1"
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
