import type { Medicine } from '@/types';
import type { MedicineFormValues } from '@/lib/medicine-form';
import { isMedicineDosageForm } from '@/lib/medicine-constants';

export type MedicineAutofillField = keyof Pick<
  MedicineFormValues,
  | 'company'
  | 'dosageForm'
  | 'packSize'
  | 'category'
  | 'genericName'
  | 'brandName'
  | 'strength'
  | 'scheduleClass'
  | 'composition'
  | 'imageUrl'
>;

export const MEDICINE_AUTOFILL_FIELDS: MedicineAutofillField[] = [
  'company',
  'dosageForm',
  'packSize',
  'category',
  'genericName',
  'brandName',
  'strength',
  'scheduleClass',
  'composition',
  'imageUrl',
];

export function medicineToAutofillFields(medicine: Medicine): Pick<MedicineFormValues, MedicineAutofillField> {
  return {
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

export function applyMedicineAutofill(
  current: MedicineFormValues,
  medicine: Medicine,
  touchedFields: ReadonlySet<MedicineAutofillField>,
): MedicineFormValues {
  const autofill = medicineToAutofillFields(medicine);
  const next: MedicineFormValues = { ...current };

  for (const field of MEDICINE_AUTOFILL_FIELDS) {
    if (!touchedFields.has(field)) {
      (next[field] as string) = autofill[field];
    }
  }

  return next;
}

export function isReliableMedicineMatch(query: string, medicine: Medicine): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return false;
  return [medicine.name, medicine.genericName, medicine.brandName]
    .filter(Boolean)
    .some((value) => value!.trim().toLowerCase() === normalized);
}

export function findReliableMedicineMatch(query: string, medicines: Medicine[]): Medicine | null {
  if (medicines.length !== 1) return null;
  return isReliableMedicineMatch(query, medicines[0]) ? medicines[0] : null;
}
