import { ListingStatus, NotificationType } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { notificationService } from '../notification';

export class PriceAlertService {
  async list(userId: string) {
    return prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        medicine: {
          select: { id: true, name: true, company: true, genericName: true },
        },
      },
    });
  }

  async upsert(userId: string, medicineId: string, maxPrice: number) {
    const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
    if (!medicine) throw AppError.notFound('Medicine not found');

    return prisma.priceAlert.upsert({
      where: { userId_medicineId: { userId, medicineId } },
      create: { userId, medicineId, maxPrice, isEnabled: true },
      update: { maxPrice, isEnabled: true },
      include: { medicine: true },
    });
  }

  async update(userId: string, id: string, data: { maxPrice?: number; isEnabled?: boolean }) {
    const existing = await prisma.priceAlert.findFirst({ where: { id, userId } });
    if (!existing) throw AppError.notFound('Price alert not found');

    return prisma.priceAlert.update({
      where: { id },
      data,
      include: { medicine: true },
    });
  }

  async remove(userId: string, id: string) {
    const existing = await prisma.priceAlert.findFirst({ where: { id, userId } });
    if (!existing) throw AppError.notFound('Price alert not found');
    await prisma.priceAlert.delete({ where: { id } });
    return { message: 'Price alert removed' };
  }

  async listTriggered(userId: string, includeDismissed = false) {
    return prisma.triggeredAlert.findMany({
      where: {
        userId,
        ...(includeDismissed ? {} : { isDismissed: false }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        medicine: { select: { id: true, name: true, company: true } },
        listing: {
          select: {
            id: true, finalPrice: true, availableQty: true, moq: true,
            pharmacy: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async dismiss(userId: string, id: string) {
    const alert = await prisma.triggeredAlert.findFirst({ where: { id, userId } });
    if (!alert) throw AppError.notFound('Triggered alert not found');
    return prisma.triggeredAlert.update({ where: { id }, data: { isDismissed: true } });
  }

  async simulate(userId: string, medicineId: string, listingPrice: number) {
    const alert = await prisma.priceAlert.findUnique({
      where: { userId_medicineId: { userId, medicineId } },
    });
    if (!alert) throw AppError.badRequest('Set a price alert for this medicine first');

    const listing = await prisma.listing.findFirst({
      where: { medicineId, status: ListingStatus.ACTIVE },
      orderBy: { finalPrice: 'asc' },
    });

    return prisma.triggeredAlert.create({
      data: {
        userId,
        priceAlertId: alert.id,
        medicineId,
        listingId: listing?.id,
        listingPrice,
        maxPrice: alert.maxPrice,
        isSimulated: true,
      },
      include: {
        medicine: true,
        listing: { include: { pharmacy: { select: { name: true } } } },
      },
    });
  }

  async evaluateListing(listing: { id: string; medicineId: string; finalPrice: unknown; status: ListingStatus }) {
    if (listing.status !== ListingStatus.ACTIVE) return;

    const price = Number(listing.finalPrice);
    const alerts = await prisma.priceAlert.findMany({
      where: {
        medicineId: listing.medicineId,
        isEnabled: true,
        maxPrice: { gte: price },
      },
      include: { medicine: true, user: true },
    });

    for (const alert of alerts) {
      const existing = await prisma.triggeredAlert.findFirst({
        where: {
          priceAlertId: alert.id,
          listingId: listing.id,
          isDismissed: false,
        },
      });
      if (existing) continue;

      await prisma.triggeredAlert.create({
        data: {
          userId: alert.userId,
          priceAlertId: alert.id,
          medicineId: listing.medicineId,
          listingId: listing.id,
          listingPrice: price,
          maxPrice: alert.maxPrice,
        },
      });

      await notificationService.create({
        userId: alert.userId,
        type: NotificationType.SYSTEM,
        title: 'Price Alert',
        body: `${alert.medicine.name} is now ৳${price.toFixed(2)} (your max: ৳${Number(alert.maxPrice).toFixed(2)})`,
        data: { medicineId: listing.medicineId, listingId: listing.id },
      });
    }
  }
}

export const priceAlertService = new PriceAlertService();
