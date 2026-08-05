export type CartValidationCode =
  | 'MOQ_VIOLATION'
  | 'INSUFFICIENT_STOCK'
  | 'LISTING_UNAVAILABLE';

export interface ListingCartContext {
  id: string;
  moq: number;
  availableQty: number;
  status: string;
  medicine?: { name: string } | null;
}

export interface CartQuantityIssue {
  code: CartValidationCode;
  message: string;
  moq?: number;
  availableQty?: number;
}

export interface CartItemIssue extends CartQuantityIssue {
  cartItemId: string;
  listingId: string;
  medicineName?: string;
  quantity: number;
}

export function validateCartQuantity(
  listing: ListingCartContext,
  quantity: number,
): CartQuantityIssue | null {
  if (listing.status !== 'ACTIVE') {
    return { code: 'LISTING_UNAVAILABLE', message: 'Listing is no longer available' };
  }
  if (quantity < listing.moq) {
    return {
      code: 'MOQ_VIOLATION',
      message: `Minimum order quantity is ${listing.moq}`,
      moq: listing.moq,
    };
  }
  if (quantity > listing.availableQty) {
    return {
      code: 'INSUFFICIENT_STOCK',
      message: `Only ${listing.availableQty} units available`,
      availableQty: listing.availableQty,
    };
  }
  return null;
}

export function validateCartItem(item: {
  id: string;
  quantity: number;
  listing: ListingCartContext;
}): CartItemIssue | null {
  const issue = validateCartQuantity(item.listing, item.quantity);
  if (!issue) return null;
  return {
    cartItemId: item.id,
    listingId: item.listing.id,
    medicineName: item.listing.medicine?.name ?? undefined,
    quantity: item.quantity,
    ...issue,
  };
}

export function collectCartIssues(
  items: { id: string; quantity: number; listing: ListingCartContext }[],
): CartItemIssue[] {
  return items
    .map((item) => validateCartItem(item))
    .filter((issue): issue is CartItemIssue => issue !== null);
}
