import { describe, expect, it } from 'vitest';
import { DEFAULT_NOTIFICATION_PREFS, normalizeNotificationPrefs } from '@/lib/notification-prefs';
import { isListingDraftEmpty } from '@/lib/listing-draft';

describe('notification-prefs', () => {
  it('fills defaults for missing keys', () => {
    expect(normalizeNotificationPrefs({ chat: false })).toEqual({
      ...DEFAULT_NOTIFICATION_PREFS,
      chat: false,
    });
  });
});

describe('listing-draft', () => {
  it('detects empty drafts', () => {
    expect(isListingDraftEmpty({
      medicineId: '',
      medicineQuery: '',
      batchNumber: '',
      mfgDate: '',
      expiryDate: '',
      purchasePrice: '',
      sellingPrice: '',
      discountPercent: '0',
      availableQty: '',
      moq: '1',
      lowStockThreshold: '',
      updatedAt: '',
    })).toBe(true);
  });
});
