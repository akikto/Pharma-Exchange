import { ListingStatus, NotificationType } from '@prisma/client';
import prisma from '../../config/database';
import { notificationService } from '../notification';
import {
  LISTING_STALE_EXPIRE_AFTER_DAYS,
  LISTING_STALE_EXPIRED_BODY,
  LISTING_STALE_REMINDER_AFTER_DAYS,
  LISTING_STALE_REMINDER_BODY,
  LISTING_STALE_REMINDER_TITLE,
} from './listing.stale.constants';

export function sellerActivityTouchFields(now = new Date()) {
  return {
    lastSellerActivityAt: now,
    staleListingReminderSentAt: null,
  };
}

function daysAgo(days: number, now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

export type StaleListingJobResult = {
  remindersSent: number;
  expired: number;
};

export async function runStaleListingMaintenance(now = new Date()): Promise<StaleListingJobResult> {
  const reminderCutoff = daysAgo(LISTING_STALE_REMINDER_AFTER_DAYS, now);
  const expireCutoff = daysAgo(LISTING_STALE_EXPIRE_AFTER_DAYS, now);

  const expireResult = await prisma.listing.updateMany({
    where: {
      status: { in: [ListingStatus.ACTIVE, ListingStatus.PAUSED] },
      lastSellerActivityAt: { lt: expireCutoff },
    },
    data: { status: ListingStatus.EXPIRED },
  });

  const needsReminder = await prisma.listing.findMany({
    where: {
      status: { in: [ListingStatus.ACTIVE, ListingStatus.PAUSED] },
      lastSellerActivityAt: { lt: reminderCutoff, gte: expireCutoff },
      staleListingReminderSentAt: null,
    },
    include: {
      medicine: { select: { name: true } },
      pharmacy: { select: { userId: true } },
    },
  });

  let remindersSent = 0;
  for (const listing of needsReminder) {
    await notificationService.create({
      userId: listing.pharmacy.userId,
      type: NotificationType.SYSTEM,
      title: LISTING_STALE_REMINDER_TITLE,
      body: `${listing.medicine.name}: ${LISTING_STALE_REMINDER_BODY}`,
      data: { listingId: listing.id, kind: 'listing_stale_reminder' },
    });
    await prisma.listing.update({
      where: { id: listing.id },
      data: { staleListingReminderSentAt: now },
    });
    remindersSent += 1;
  }

  return { remindersSent, expired: expireResult.count };
}
