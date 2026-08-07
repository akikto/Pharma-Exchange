/** Matches backend Prisma DosageForm enum — do not add values here. */
export const MEDICINE_DOSAGE_FORMS = [
  'TABLET',
  'CAPSULE',
  'SYRUP',
  'INJECTION',
  'CREAM',
  'OINTMENT',
  'DROPS',
  'INHALER',
  'PATCH',
  'OTHER',
] as const;

export type MedicineDosageForm = (typeof MEDICINE_DOSAGE_FORMS)[number];

export function isMedicineDosageForm(value: string): value is MedicineDosageForm {
  return (MEDICINE_DOSAGE_FORMS as readonly string[]).includes(value);
}
