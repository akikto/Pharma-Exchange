import { BulkExpiryPreset, ListingStatus } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { computeFinalPrice, generateBulkRequestNumber, parsePagination } from '../../shared/utils/helpers';
import { getPharmacyForUser } from '../../shared/middleware/pharmacy.middleware';

export function resolveExpiryDate(preset: BulkExpiryPreset, customExpiryDays?: number | null): Date {
  const date = new Date();
  switch (preset) {
    case BulkExpiryPreset.THREE_MONTHS:
      date.setMonth(date.getMonth() + 3);
      return date;
    case BulkExpiryPreset.SIX_MONTHS:
      date.setMonth(date.getMonth() + 6);
      return date;
    case BulkExpiryPreset.TWELVE_MONTHS:
      date.setMonth(date.getMonth() + 12);
      return date;
    case BulkExpiryPreset.SHORT_EXPIRY_OK:
      date.setMonth(date.getMonth() + 1);
      return date;
    case BulkExpiryPreset.CUSTOM:
      if (!customExpiryDays || customExpiryDays < 1) {
        throw AppError.badRequest('customExpiryDays is required for CUSTOM expiry preset');
      }
      date.setDate(date.getDate() + customExpiryDays);
      return date;
    default:
      throw AppError.badRequest('Invalid expiry preset');
  }
}

export class BulkRequestService {
  async list(userId: string, query: Record<string, unknown>) {
    const pharmacy = await getPharmacyForUser(userId);
    const { page, limit, skip } = parsePagination(query);

    const [data, total] = await Promise.all([
      prisma.bulkRequest.findMany({
        where: { pharmacyId: pharmacy.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          medicine: true,
          listing: { select: { id: true, status: true, finalPrice: true, availableQty: true } },
        },
      }),
      prisma.bulkRequest.count({ where: { pharmacyId: pharmacy.id } }),
    ]);

    return { data, total, page, limit };
  }

  async getById(userId: string, id: string) {
    const pharmacy = await getPharmacyForUser(userId);
    const request = await prisma.bulkRequest.findFirst({
      where: { id, pharmacyId: pharmacy.id },
      include: { medicine: true, listing: true },
    });
    if (!request) throw AppError.notFound('Bulk request not found');
    return request;
  }

  async create(userId: string, data: Record<string, unknown>) {
    const pharmacy = await getPharmacyForUser(userId);
    const medicine = await prisma.medicine.findUnique({ where: { id: data.medicineId as string } });
    if (!medicine) throw AppError.notFound('Medicine not found');

    const quantity = Number(data.quantity);
    const targetPrice = Number(data.targetPrice);
    const expiryPreset = data.expiryPreset as BulkExpiryPreset;
    const customExpiryDays = data.customExpiryDays != null ? Number(data.customExpiryDays) : undefined;
    const expiryDate = resolveExpiryDate(expiryPreset, customExpiryDays);
    const requestNumber = generateBulkRequestNumber();
    const mfgDate = new Date();

    return prisma.$transaction(async (tx) => {
      const bulkRequest = await tx.bulkRequest.create({
        data: {
          requestNumber,
          pharmacyId: pharmacy.id,
          medicineId: medicine.id,
          quantity,
          targetPrice,
          urgency: data.urgency as never,
          deliveryAddress: data.deliveryAddress as string,
          phone: data.phone as string,
          requiresColdChain: Boolean(data.requiresColdChain),
          requiresVatInvoice: Boolean(data.requiresVatInvoice),
          requiresFactorySealed: Boolean(data.requiresFactorySealed),
          expiryPreset,
          customExpiryDays,
          note: data.note as string | undefined,
        },
      });

      const moq = Math.max(1, Math.min(quantity, Math.floor(quantity / 10) || 1));
      const listing = await tx.listing.create({
        data: {
          pharmacyId: pharmacy.id,
          medicineId: medicine.id,
          batchNumber: `BULK-${requestNumber}`,
          mfgDate,
          expiryDate,
          purchasePrice: targetPrice * 0.9,
          sellingPrice: targetPrice,
          discountPercent: 0,
          finalPrice: computeFinalPrice(targetPrice, 0),
          availableQty: quantity,
          moq,
          unit: 'strip',
          status: ListingStatus.ACTIVE,
        },
        include: { medicine: true },
      });

      return tx.bulkRequest.update({
        where: { id: bulkRequest.id },
        data: { listingId: listing.id },
        include: { medicine: true, listing: true },
      });
    });
  }
}

export const bulkRequestService = new BulkRequestService();
