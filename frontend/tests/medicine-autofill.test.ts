import { describe, expect, it } from 'vitest';
import {
  applyMedicineAutofill,
  findReliableMedicineMatch,
  isReliableMedicineMatch,
  medicineToAutofillFields,
} from '@/lib/medicine-autofill';
import { EMPTY_MEDICINE_FORM } from '@/lib/medicine-form';
import type { Medicine } from '@/types';

const baseMedicine: Medicine = {
  id: 'med-1',
  name: 'Ace Plus',
  genericName: 'Paracetamol + Caffeine',
  brandName: 'Ace Plus',
  company: 'Square Pharmaceuticals',
  dosageForm: 'TABLET',
  strength: '500mg',
  packSize: '10x10 Strip',
  category: 'Analgesic',
  composition: 'Paracetamol 500mg, Caffeine 65mg',
  imageUrl: 'https://storage.example.com/public/medicines/ace.webp',
};

describe('medicine autofill', () => {
  it('maps medicine metadata into autofill fields', () => {
    expect(medicineToAutofillFields(baseMedicine)).toEqual({
      company: 'Square Pharmaceuticals',
      dosageForm: 'TABLET',
      packSize: '10x10 Strip',
      category: 'Analgesic',
      genericName: 'Paracetamol + Caffeine',
      brandName: 'Ace Plus',
      strength: '500mg',
      scheduleClass: '',
      composition: 'Paracetamol 500mg, Caffeine 65mg',
      imageUrl: 'https://storage.example.com/public/medicines/ace.webp',
    });
  });

  it('auto-fills empty fields but preserves manually edited values', () => {
    const touched = new Set(['company'] as const);
    const current = {
      ...EMPTY_MEDICINE_FORM,
      company: 'Manual Company',
    };

    const next = applyMedicineAutofill(current, baseMedicine, touched);
    expect(next.company).toBe('Manual Company');
    expect(next.strength).toBe('500mg');
    expect(next.composition).toBe('Paracetamol 500mg, Caffeine 65mg');
  });

  it('detects a reliable single exact match', () => {
    expect(isReliableMedicineMatch('ace plus', baseMedicine)).toBe(true);
    expect(findReliableMedicineMatch('ace plus', [baseMedicine])?.id).toBe('med-1');
    expect(findReliableMedicineMatch('ace', [baseMedicine])).toBeNull();
  });
});
