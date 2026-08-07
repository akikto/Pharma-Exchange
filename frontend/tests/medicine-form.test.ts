import { describe, expect, it } from 'vitest';
import {
  EMPTY_MEDICINE_FORM,
  formToCreatePayload,
  hasMedicineFormErrors,
  validateMedicineForm,
} from '@/lib/medicine-form';

describe('medicine-form validation', () => {
  const messages = {
    required: 'This field is required.',
    dosageForm: 'Select a valid dosage form.',
    imageUrl: 'Enter a valid image URL.',
  };

  it('requires core fields', () => {
    const errors = validateMedicineForm(EMPTY_MEDICINE_FORM, messages);
    expect(hasMedicineFormErrors(errors)).toBe(true);
    expect(errors.name).toBe(messages.required);
    expect(errors.company).toBe(messages.required);
    expect(errors.dosageForm).toBe(messages.dosageForm);
    expect(errors.packSize).toBe(messages.required);
    expect(errors.category).toBe(messages.required);
  });

  it('omits empty optional fields from create payload', () => {
    const payload = formToCreatePayload({
      ...EMPTY_MEDICINE_FORM,
      name: 'Ace Plus',
      company: 'Square Pharmaceuticals',
      dosageForm: 'TABLET',
      packSize: '10x10 Strip',
      category: 'Analgesic',
    });

    expect(payload).toEqual({
      name: 'Ace Plus',
      company: 'Square Pharmaceuticals',
      dosageForm: 'TABLET',
      packSize: '10x10 Strip',
      category: 'Analgesic',
    });
  });

  it('rejects invalid image URLs', () => {
    const errors = validateMedicineForm({
      ...EMPTY_MEDICINE_FORM,
      name: 'Ace Plus',
      company: 'Square Pharmaceuticals',
      dosageForm: 'TABLET',
      packSize: '10x10 Strip',
      category: 'Analgesic',
      imageUrl: 'not-a-url',
    }, messages);

    expect(errors.imageUrl).toBe(messages.imageUrl);
  });
});
