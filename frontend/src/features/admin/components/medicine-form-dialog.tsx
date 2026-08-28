import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MedicineFormFields } from '@/components/medicine/medicine-form-fields';
import { applyMedicineAutofill, MEDICINE_AUTOFILL_FIELDS, type MedicineAutofillField } from '@/lib/medicine-autofill';
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
  onExistingMedicineSelect?: (medicine: MedicineRecord) => void;
  isSubmitting?: boolean;
};

export function MedicineFormDialog({
  open,
  mode,
  medicine,
  onOpenChange,
  onSubmit,
  onExistingMedicineSelect,
  isSubmitting = false,
}: MedicineFormDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<MedicineFormValues>(EMPTY_MEDICINE_FORM);
  const [errors, setErrors] = useState<MedicineFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [touchedFields, setTouchedFields] = useState<Set<MedicineAutofillField>>(new Set());

  useEffect(() => {
    if (!open) return;
    setForm(mode === 'edit' && medicine ? medicineToForm(medicine) : EMPTY_MEDICINE_FORM);
    setErrors({});
    setSubmitError('');
    setTouchedFields(new Set());
  }, [open, mode, medicine]);

  const updateField = <K extends keyof MedicineFormValues>(key: K, value: MedicineFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (MEDICINE_AUTOFILL_FIELDS.includes(key as MedicineAutofillField)) {
      setTouchedFields((current) => new Set(current).add(key as MedicineAutofillField));
    }
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setSubmitError('');
  };

  const handleMedicineAutofill = (selected: MedicineRecord) => {
    setForm((current) => applyMedicineAutofill(current, selected, touchedFields));
    setErrors({});
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
          <MedicineFormFields
            mode={mode}
            form={form}
            errors={errors}
            onFieldChange={updateField}
            onMedicineAutofill={handleMedicineAutofill}
            onExistingMedicineSelect={onExistingMedicineSelect}
          />

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
