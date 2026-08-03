export type BulkExpiryPreset =
  | 'THREE_MONTHS'
  | 'SIX_MONTHS'
  | 'TWELVE_MONTHS'
  | 'SHORT_EXPIRY_OK'
  | 'CUSTOM';

export type BulkUrgency = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface BulkRequestForm {
  medicineId: string;
  medicineName: string;
  quantity: string;
  targetPrice: string;
  urgency: BulkUrgency;
  deliveryAddress: string;
  phone: string;
  requiresColdChain: boolean;
  requiresVatInvoice: boolean;
  requiresFactorySealed: boolean;
  expiryPreset: BulkExpiryPreset;
  customExpiryDays: string;
  note: string;
}

export const EXPIRY_PRESETS: BulkExpiryPreset[] = [
  'THREE_MONTHS',
  'SIX_MONTHS',
  'TWELVE_MONTHS',
  'SHORT_EXPIRY_OK',
  'CUSTOM',
];

export const URGENCY_OPTIONS: BulkUrgency[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export function validateBulkForm(form: BulkRequestForm): Record<string, string> {
  const errors: Record<string, string> = {};
  const quantity = Number(form.quantity);
  const targetPrice = Number(form.targetPrice);

  if (!form.medicineId) errors.medicineId = 'required';
  if (!quantity || quantity < 1) errors.quantity = 'min';
  if (!targetPrice || targetPrice <= 0) errors.targetPrice = 'min';
  if (!form.deliveryAddress.trim()) errors.deliveryAddress = 'required';
  if (!form.phone.trim() || form.phone.trim().length < 10) errors.phone = 'min';
  if (form.expiryPreset === 'CUSTOM') {
    const days = Number(form.customExpiryDays);
    if (!days || days < 1) errors.customExpiryDays = 'min';
  }
  return errors;
}

export function buildBulkPayload(form: BulkRequestForm) {
  return {
    medicineId: form.medicineId,
    quantity: Number(form.quantity),
    targetPrice: Number(form.targetPrice),
    urgency: form.urgency,
    deliveryAddress: form.deliveryAddress.trim(),
    phone: form.phone.trim(),
    requiresColdChain: form.requiresColdChain,
    requiresVatInvoice: form.requiresVatInvoice,
    requiresFactorySealed: form.requiresFactorySealed,
    expiryPreset: form.expiryPreset,
    ...(form.expiryPreset === 'CUSTOM' ? { customExpiryDays: Number(form.customExpiryDays) } : {}),
    ...(form.note.trim() ? { note: form.note.trim() } : {}),
  };
}
