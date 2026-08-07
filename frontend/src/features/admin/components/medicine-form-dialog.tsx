import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MEDICINE_DOSAGE_FORMS } from '@/lib/medicine-constants';
import { getErrorMessage } from '@/lib/api-errors';
import {
  EMPTY_MEDICINE_FORM,
  hasMedicineFormErrors,
  medicineToForm,
  validateMedicineForm,
  type MedicineFormErrors,
  type MedicineFormValues,
  type MedicineRecord,
} from '@/lib/medicine-form';

type MedicineFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  medicine?: MedicineRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MedicineFormValues) => Promise<void>;
  isSubmitting?: boolean;
};

export function MedicineFormDialog({
  open,
  mode,
  medicine,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: MedicineFormDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<MedicineFormValues>(EMPTY_MEDICINE_FORM);
  const [errors, setErrors] = useState<MedicineFormErrors>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(mode === 'edit' && medicine ? medicineToForm(medicine) : EMPTY_MEDICINE_FORM);
    setErrors({});
    setSubmitError('');
  }, [open, mode, medicine]);

  const updateField = <K extends keyof MedicineFormValues>(key: K, value: MedicineFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setSubmitError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validateMedicineForm(form, {
      required: t('admin.medicines.validation.required'),
      dosageForm: t('admin.medicines.validation.dosageForm'),
      imageUrl: t('admin.medicines.validation.imageUrl'),
    });
    if (hasMedicineFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="medicine-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('admin.medicines.addTitle') : t('admin.medicines.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? t('admin.medicines.addDesc') : t('admin.medicines.editDesc')}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="medicine-name"
              label={t('admin.medicines.fields.name')}
              required
              value={form.name}
              error={errors.name}
              onChange={(value) => updateField('name', value)}
            />
            <Field
              id="medicine-company"
              label={t('admin.medicines.fields.company')}
              required
              value={form.company}
              error={errors.company}
              onChange={(value) => updateField('company', value)}
            />
            <div>
              <Label htmlFor="medicine-dosage-form">{t('admin.medicines.fields.dosageForm')} *</Label>
              <select
                id="medicine-dosage-form"
                data-testid="medicine-dosage-form"
                className="mt-1 flex h-10 w-full rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 text-sm"
                value={form.dosageForm}
                onChange={(event) => updateField('dosageForm', event.target.value as MedicineFormValues['dosageForm'])}
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
              onChange={(value) => updateField('packSize', value)}
            />
            <Field
              id="medicine-category"
              label={t('admin.medicines.fields.category')}
              required
              value={form.category}
              error={errors.category}
              onChange={(value) => updateField('category', value)}
            />
            <Field
              id="medicine-strength"
              label={t('admin.medicines.fields.strength')}
              value={form.strength}
              error={errors.strength}
              onChange={(value) => updateField('strength', value)}
            />
            <Field
              id="medicine-generic-name"
              label={t('admin.medicines.fields.genericName')}
              value={form.genericName}
              error={errors.genericName}
              onChange={(value) => updateField('genericName', value)}
            />
            <Field
              id="medicine-brand-name"
              label={t('admin.medicines.fields.brandName')}
              value={form.brandName}
              error={errors.brandName}
              onChange={(value) => updateField('brandName', value)}
            />
            <Field
              id="medicine-schedule-class"
              label={t('admin.medicines.fields.scheduleClass')}
              value={form.scheduleClass}
              error={errors.scheduleClass}
              onChange={(value) => updateField('scheduleClass', value)}
            />
            <Field
              id="medicine-image-url"
              label={t('admin.medicines.fields.imageUrl')}
              value={form.imageUrl}
              error={errors.imageUrl}
              onChange={(value) => updateField('imageUrl', value)}
            />
          </div>

          <div>
            <Label htmlFor="medicine-composition">{t('admin.medicines.fields.composition')}</Label>
            <textarea
              id="medicine-composition"
              className="mt-1 w-full min-h-[80px] rounded-[var(--radius-md)] border border-border-subtle px-3 py-2 text-sm bg-surface-base"
              value={form.composition}
              onChange={(event) => updateField('composition', event.target.value)}
            />
          </div>

          {submitError && (
            <p className="text-sm text-danger" data-testid="medicine-form-error">{submitError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {mode === 'create' ? t('admin.medicines.createAction') : t('admin.medicines.saveAction')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
