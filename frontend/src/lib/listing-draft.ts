import { LOCAL_DB_KEYS, getLocalJson, removeLocalJson, setLocalJson } from '@/lib/local-db';

export interface ListingDraft {
  medicineId: string;
  medicineQuery: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  purchasePrice: string;
  sellingPrice: string;
  discountPercent: string;
  availableQty: string;
  moq: string;
  lowStockThreshold: string;
  imageUrl?: string;
  updatedAt: string;
}

export function isListingDraftEmpty(draft: ListingDraft): boolean {
  return !draft.medicineId &&
    !draft.batchNumber &&
    !draft.mfgDate &&
    !draft.expiryDate &&
    !draft.purchasePrice &&
    !draft.sellingPrice &&
    !draft.availableQty &&
    !draft.imageUrl;
}

export async function loadListingDraft(): Promise<ListingDraft | null> {
  return getLocalJson<ListingDraft>(LOCAL_DB_KEYS.listingDraft);
}

export async function saveListingDraft(draft: ListingDraft): Promise<void> {
  await setLocalJson(LOCAL_DB_KEYS.listingDraft, { ...draft, updatedAt: new Date().toISOString() });
}

export async function clearListingDraft(): Promise<void> {
  await removeLocalJson(LOCAL_DB_KEYS.listingDraft);
}
