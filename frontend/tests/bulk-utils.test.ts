import { describe, it, expect } from 'vitest';
import { validateBulkForm, buildBulkPayload } from '@/lib/bulk-utils';

const validForm = {
  medicineId: 'med-1',
  medicineName: 'Napa',
  quantity: '500',
  targetPrice: '12.5',
  urgency: 'NORMAL' as const,
  deliveryAddress: '123 Pharma Street, Dhaka',
  phone: '9876543210',
  requiresColdChain: false,
  requiresVatInvoice: true,
  requiresFactorySealed: false,
  expiryPreset: 'SIX_MONTHS' as const,
  customExpiryDays: '',
  note: '',
};

describe('bulk-utils', () => {
  it('validateBulkForm catches missing and invalid fields', () => {
    expect(validateBulkForm({ ...validForm, medicineId: '' }).medicineId).toBe('required');
    expect(validateBulkForm({ ...validForm, quantity: '0' }).quantity).toBe('min');
    expect(validateBulkForm({ ...validForm, expiryPreset: 'CUSTOM' }).customExpiryDays).toBe('min');
  });

  it('buildBulkPayload maps form to API body', () => {
    const payload = buildBulkPayload(validForm);
    expect(payload.quantity).toBe(500);
    expect(payload.requiresVatInvoice).toBe(true);
    expect(payload.customExpiryDays).toBeUndefined();
  });
});
