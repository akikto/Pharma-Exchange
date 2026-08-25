import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListingStatus } from '@prisma/client';
import {
  LISTING_STALE_EXPIRE_AFTER_DAYS,
  LISTING_STALE_REMINDER_AFTER_DAYS,
} from '../src/modules/listing/listing.stale.constants';

const listingFindMany = vi.fn();
const listingUpdate = vi.fn();
const listingUpdateMany = vi.fn();
const notificationCreate = vi.fn();

vi.mock('../src/config/database', () => ({
  default: {
    listing: {
      findMany: (...args: unknown[]) => listingFindMany(...args),
      update: (...args: unknown[]) => listingUpdate(...args),
      updateMany: (...args: unknown[]) => listingUpdateMany(...args),
    },
  },
}));

vi.mock('../src/modules/notification', () => ({
  notificationService: {
    create: (...args: unknown[]) => notificationCreate(...args),
  },
}));

import { runStaleListingMaintenance } from '../src/modules/listing/listing.stale.service';

describe('runStaleListingMaintenance', () => {
  const now = new Date('2026-08-25T12:00:00.000Z');

  beforeEach(() => {
    vi.clearAllMocks();
    listingUpdateMany.mockResolvedValue({ count: 2 });
    listingFindMany.mockResolvedValue([]);
    listingUpdate.mockResolvedValue({});
    notificationCreate.mockResolvedValue({});
  });

  it('uses configured reminder and expiry day thresholds', () => {
    expect(LISTING_STALE_REMINDER_AFTER_DAYS).toBe(4);
    expect(LISTING_STALE_EXPIRE_AFTER_DAYS).toBe(5);
  });

  it('expires listings inactive longer than the expiry window', async () => {
    await runStaleListingMaintenance(now);

    expect(listingUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: [ListingStatus.ACTIVE, ListingStatus.PAUSED] },
          lastSellerActivityAt: { lt: new Date('2026-08-20T12:00:00.000Z') },
        }),
        data: { status: ListingStatus.EXPIRED },
      }),
    );
  });

  it('sends reminders for listings in the reminder window', async () => {
    listingFindMany.mockResolvedValue([
      {
        id: 'listing-1',
        medicine: { name: 'Napa' },
        pharmacy: { userId: 'seller-user' },
      },
    ]);

    await runStaleListingMaintenance(now);

    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'seller-user',
        data: expect.objectContaining({ listingId: 'listing-1', kind: 'listing_stale_reminder' }),
      }),
    );
    expect(listingUpdate).toHaveBeenCalledWith({
      where: { id: 'listing-1' },
      data: { staleListingReminderSentAt: now },
    });
  });
});
