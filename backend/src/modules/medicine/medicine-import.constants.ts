import { DosageForm } from '@prisma/client';

export const MEDICINE_IMPORT_MAX_ROWS = 2000;
export const MEDICINE_IMPORT_MAX_BYTES = 5 * 1024 * 1024;

/** Column headers for template / import (must match medicine create fields). */
export const MEDICINE_IMPORT_COLUMNS = [
  'name',
  'genericName',
  'brandName',
  'company',
  'dosageForm',
  'strength',
  'packSize',
  'category',
  'scheduleClass',
  'composition',
  'imageUrl',
] as const;

export type MedicineImportColumn = (typeof MEDICINE_IMPORT_COLUMNS)[number];

export const REQUIRED_IMPORT_COLUMNS: MedicineImportColumn[] = [
  'name',
  'company',
  'dosageForm',
  'packSize',
  'category',
];

export const DOSAGE_FORM_VALUES = new Set<string>(Object.values(DosageForm));

export const TEMPLATE_EXAMPLE_ROW: Record<MedicineImportColumn, string> = {
  name: 'Napa Extra',
  genericName: 'Paracetamol',
  brandName: 'Napa Extra',
  company: 'Beximco Pharmaceuticals',
  dosageForm: 'TABLET',
  strength: '500mg',
  packSize: '10 tablets',
  category: 'Analgesic',
  scheduleClass: '',
  composition: 'Paracetamol 500mg',
  imageUrl: '',
};
