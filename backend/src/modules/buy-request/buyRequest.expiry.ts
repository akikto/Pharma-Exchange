import { BuyRequestStatus } from '@prisma/client';

type ExpirableBuyRequest = {
  status: BuyRequestStatus | string;
  expiresAt: Date | null;
};

export function isBuyRequestPastExpiry(request: ExpirableBuyRequest, now = new Date()): boolean {
  if (!request.expiresAt) return false;
  return request.expiresAt.getTime() <= now.getTime();
}

export function effectiveBuyRequestStatus(
  request: ExpirableBuyRequest,
  now = new Date(),
): BuyRequestStatus | string {
  if (request.status === BuyRequestStatus.PENDING && isBuyRequestPastExpiry(request, now)) {
    return BuyRequestStatus.EXPIRED;
  }
  return request.status;
}

export function sellerCanRespondToBuyRequest(request: ExpirableBuyRequest, now = new Date()): boolean {
  return effectiveBuyRequestStatus(request, now) === BuyRequestStatus.PENDING;
}
