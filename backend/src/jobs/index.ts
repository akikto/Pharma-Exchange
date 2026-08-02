import cron from 'node-cron';
import { ListingStatus, NotificationType } from '@prisma/client';
import prisma from '../config/database';
import { logger } from '../shared/utils/logger';
import { NotificationService } from '../modules/notification/notification.service';

const notificationService = new NotificationService();

export function startBackgroundJobs() {
  // Short expiry alerts — daily at 8 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running short expiry alert job');
    try {
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      const expiringListings = await prisma.listing.findMany({
        where: {
          status: ListingStatus.ACTIVE,
          expiryDate: { lte: sixMonthsFromNow, gt: new Date() },
        },
        include: { pharmacy: true, medicine: true },
      });

      const pharmacyAlerts = new Map<string, number>();
      for (const listing of expiringListings) {
        pharmacyAlerts.set(listing.pharmacyId, (pharmacyAlerts.get(listing.pharmacyId) ?? 0) + 1);
      }

      for (const [pharmacyId, count] of pharmacyAlerts) {
        const pharmacy = expiringListings.find((l) => l.pharmacyId === pharmacyId)?.pharmacy;
        if (!pharmacy) continue;

        await notificationService.create({
          userId: pharmacy.userId,
          type: NotificationType.SYSTEM,
          title: 'Short Expiry Alert',
          body: `${count} listing(s) expiring within 6 months. Consider discounting.`,
          data: { pharmacyId, count },
        });
      }

      logger.info(`Short expiry alerts sent for ${pharmacyAlerts.size} pharmacies`);
    } catch (err) {
      logger.error('Short expiry alert job failed', { error: (err as Error).message });
    }
  });

  // Expire buy requests — every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running buy request expiry job');
    try {
      const result = await prisma.buyRequest.updateMany({
        where: { status: 'PENDING', expiresAt: { lt: new Date() } },
        data: { status: 'EXPIRED' },
      });
      if (result.count > 0) logger.info(`Expired ${result.count} buy requests`);
    } catch (err) {
      logger.error('Buy request expiry job failed', { error: (err as Error).message });
    }
  });

  // Listing cleanup — mark expired listings daily at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running listing cleanup job');
    try {
      const result = await prisma.listing.updateMany({
        where: { status: ListingStatus.ACTIVE, expiryDate: { lt: new Date() } },
        data: { status: ListingStatus.EXPIRED },
      });
      if (result.count > 0) logger.info(`Marked ${result.count} listings as expired`);
    } catch (err) {
      logger.error('Listing cleanup job failed', { error: (err as Error).message });
    }
  });

  logger.info('Background jobs scheduled');
}
