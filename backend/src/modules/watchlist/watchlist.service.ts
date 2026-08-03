import { ListingStatus, NotificationType, PriceTrend } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';

export function computePriceTrend(medicineId: string, bestPrice: number | null): PriceTrend {
  if (bestPrice == null) return PriceTrend.STABLE;
  const seed = medicineId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const offset = (seed % 10) - 5;
  const adjusted = bestPrice + offset;
  if (adjusted < bestPrice) return PriceTrend.DOWN;
  if (adjusted > bestPrice) return PriceTrend.UP;
  return PriceTrend.STABLE;
}

async function getBestOffer(medicineId: string) {
  const listings = await prisma.listing.findMany({
    where: {
      medicineId,
      status: ListingStatus.ACTIVE,
      availableQty: { gt: 0 },
      pharmacy: { isActive: true, verificationStatus: 'APPROVED' },
    },
    orderBy: { finalPrice: 'asc' },
    take: 1,
    include: {
      pharmacy: { select: { id: true, name: true, city: true } },
    },
  });
  if (!listings.length) return null;
  const best = listings[0];
  const sellerCount = await prisma.listing.count({
    where: {
      medicineId,
      status: ListingStatus.ACTIVE,
      availableQty: { gt: 0 },
      pharmacy: { isActive: true, verificationStatus: 'APPROVED' },
    },
  });
  return {
    bestPrice: Number(best.finalPrice),
    bestListingId: best.id,
    sellerCount,
    bestPharmacy: best.pharmacy,
  };
}

export class WatchlistService {
  async list(userId: string) {
    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        medicine: {
          select: {
            id: true, name: true, company: true, genericName: true,
            dosageForm: true, packSize: true, category: true, imageUrl: true,
          },
        },
      },
    });

    const enriched = await Promise.all(items.map(async (item) => {
      const offer = await getBestOffer(item.medicineId);
      const bestPrice = offer?.bestPrice ?? null;
      return {
        ...item,
        bestPrice,
        sellerCount: offer?.sellerCount ?? 0,
        bestListingId: offer?.bestListingId ?? null,
        bestPharmacy: offer?.bestPharmacy ?? null,
        priceTrend: computePriceTrend(item.medicineId, bestPrice),
      };
    }));

    return enriched;
  }

  async getIds(userId: string) {
    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      select: { medicineId: true },
    });
    return items.map((i) => i.medicineId);
  }

  async add(userId: string, medicineId: string) {
    const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
    if (!medicine) throw AppError.notFound('Medicine not found');

    return prisma.watchlistItem.upsert({
      where: { userId_medicineId: { userId, medicineId } },
      create: { userId, medicineId },
      update: {},
      include: { medicine: true },
    });
  }

  async remove(userId: string, medicineId: string) {
    await prisma.watchlistItem.deleteMany({ where: { userId, medicineId } });
    return { message: 'Removed from watchlist' };
  }
}

export const watchlistService = new WatchlistService();
