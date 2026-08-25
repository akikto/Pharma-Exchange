import type { BuyRequest } from '@/types';

export function isBuyRequestExpired(request: Pick<BuyRequest, 'status' | 'expiresAt'>): boolean {
  if (request.status === 'EXPIRED') return true;
  if (request.status !== 'PENDING' || !request.expiresAt) return false;
  return new Date(request.expiresAt).getTime() <= Date.now();
}

export function effectiveBuyRequestStatus(request: Pick<BuyRequest, 'status' | 'expiresAt'>): string {
  if (isBuyRequestExpired(request)) return 'EXPIRED';
  return request.status;
}

export function canSellerRespondToBuyRequest(request: Pick<BuyRequest, 'status' | 'expiresAt'>): boolean {
  return effectiveBuyRequestStatus(request) === 'PENDING';
}

export function canBuyerResendBuyRequest(request: Pick<BuyRequest, 'status' | 'expiresAt'>): boolean {
  return effectiveBuyRequestStatus(request) === 'EXPIRED';
}
