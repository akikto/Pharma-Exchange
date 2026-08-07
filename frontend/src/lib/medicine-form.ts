import { isMedicineDosageForm, type MedicineDosageForm } from '@/lib/medicine-constants';
import type { Medicine } from '@/types';

export type MedicineFormValues = {
  name: string;
  company: string;
  dosageForm: MedicineDosageForm | '';
  packSize: string;
  category: string;
  genericName: string;
  brandName: string;
  strength: string;
  scheduleClass: string;
  composition: string;
  imageUrl: string;
};

export type MedicineFormErrors = Partial<Record<keyof MedicineFormValues, string>>;

export const EMPTY_MEDICINE_FORM: MedicineFormValues = {
  name: '',
  company: '',
  dosageForm: '',
  packSize: '',
  category: '',
  genericName: '',
  brandName: '',
  strength: '',
  scheduleClass: '',
  composition: '',
  imageUrl: '',
};

export type MedicineRecord = Medicine & {
  isActive?: boolean;
  scheduleClass?: string | null;
};

export function medicineToForm(medicine: MedicineRecord): MedicineFormValues {
  return {
    name: medicine.name,
    company: medicine.company,
    dosageForm: isMedicineDosageForm(medicine.dosageForm) ? medicine.dosageForm : '',
    packSize: medicine.packSize,
    category: medicine.category,
    genericName: medicine.genericName ?? '',
    brandName: medicine.brandName ?? '',
    strength: medicine.strength ?? '',
    scheduleClass: medicine.scheduleClass ?? '',
    composition: medicine.composition ?? '',
    imageUrl: medicine.imageUrl ?? '',
  };
}

function optionalField(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function formToCreatePayload(values: MedicineFormValues) {
  return {
    name: values.name.trim(),
    company: values.company.trim(),
    dosageForm: values.dosageForm,
    packSize: values.packSize.trim(),
    category: values.category.trim(),
    genericName: optionalField(values.genericName),
    brandName: optionalField(values.brandName),
    strength: optionalField(values.strength),
    scheduleClass: optionalField(values.scheduleClass),
    composition: optionalField(values.composition),
    imageUrl: optionalField(values.imageUrl),
  };
}

export function formToUpdatePayload(values: MedicineFormValues) {
  return formToCreatePayload(values);
}

export function validateMedicineForm(
  values: MedicineFormValues,
  messages: {
    required: string;
    dosageForm: string;
    imageUrl: string;
  },
): MedicineFormErrors {
  const errors: MedicineFormErrors = {};

  if (!values.name.trim()) errors.name = messages.required;
  if (!values.company.trim()) errors.company = messages.required;
  if (!values.dosageForm || !isMedicineDosageForm(values.dosageForm)) {
    errors.dosageForm = messages.dosageForm;
  }
  if (!values.packSize.trim()) errors.packSize = messages.required;
  if (!values.category.trim()) errors.category = messages.required;

  const imageUrl = values.imageUrl.trim();
  if (imageUrl) {
    try {
      // eslint-disable-next-line no-new
      new URL(imageUrl);
    } catch {
      errors.imageUrl = messages.imageUrl;
    }
  }

  return errors;
}

export function hasMedicineFormErrors(errors: MedicineFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
