import type { CartItem } from '@/types';

export type CartValidationCode =
  | 'MOQ_VIOLATION'
  | 'INSUFFICIENT_STOCK'
  | 'LISTING_UNAVAILABLE';

export interface CartItemIssue {
  cartItemId: string;
  listingId: string;
  medicineName?: string;
  quantity: number;
  code: CartValidationCode;
  message: string;
  moq?: number;
  availableQty?: number;
}

export function validateCartItem(item: CartItem): CartItemIssue | null {
  const listing = item.listing;
  if (!listing?.id) return null;

  if (listing.status !== 'ACTIVE') {
    return {
      cartItemId: item.id,
      listingId: listing.id,
      medicineName: listing.medicine?.name,
      quantity: item.quantity,
      code: 'LISTING_UNAVAILABLE',
      message: 'Listing is no longer available',
    };
  }

  if (item.quantity < listing.moq) {
    return {
      cartItemId: item.id,
      listingId: listing.id,
      medicineName: listing.medicine?.name,
      quantity: item.quantity,
      code: 'MOQ_VIOLATION',
      message: `Minimum order quantity is ${listing.moq}`,
      moq: listing.moq,
    };
  }

  if (item.quantity > listing.availableQty) {
    return {
      cartItemId: item.id,
      listingId: listing.id,
      medicineName: listing.medicine?.name,
      quantity: item.quantity,
      code: 'INSUFFICIENT_STOCK',
      message: `Only ${listing.availableQty} units available`,
      availableQty: listing.availableQty,
    };
  }

  return null;
}

export function validateSellerCartGroup(items: CartItem[]): CartItemIssue[] {
  return items
    .map((item) => validateCartItem(item))
    .filter((issue): issue is CartItemIssue => issue !== null);
}

export function formatCartIssueMessage(issue: CartItemIssue): string {
  const prefix = issue.medicineName ? `${issue.medicineName}: ` : '';
  return `${prefix}${issue.message}`;
}

export function findCartItemIssue(
  issues: CartItemIssue[],
  cartItemId: string,
): CartItemIssue | undefined {
  return issues.find((issue) => issue.cartItemId === cartItemId);
}
