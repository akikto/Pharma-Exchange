import type { CartItem } from '@/types';

export function cartItemLineTotal(item: CartItem): number {
  return Number(item.listing.finalPrice) * item.quantity;
}

export function cartGroupSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + cartItemLineTotal(item), 0);
}

export function cartGrandTotal(grouped: Record<string, CartItem[]>): number {
  return Object.values(grouped).reduce((sum, items) => sum + cartGroupSubtotal(items), 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
