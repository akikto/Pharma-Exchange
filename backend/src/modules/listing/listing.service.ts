import { ListingStatus, VerificationStatus } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { computeFinalPrice, parsePagination } from '../../shared/utils/helpers';
import { getPharmacyForUser } from '../../shared/middleware/pharmacy.middleware';

export class ListingService {
  async search(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const {
      q, composition, company, category, city, district, pharmacyId,
      minPrice, maxPrice, minDiscount, maxExpiryMonths, minExpiryMonths,
      sortBy = 'createdAt', sortOrder = 'desc', status = ListingStatus.ACTIVE,
    } = query;

    const now = new Date();
    const expiryFilter: Record<string, Date> = {};
    if (maxExpiryMonths) {
      const maxDate = new Date(now);
      maxDate.setMonth(maxDate.getMonth() + Number(maxExpiryMonths));
      expiryFilter.lte = maxDate;
    }
    if (minExpiryMonths) {
      const minDate = new Date(now);
      minDate.setMonth(minDate.getMonth() + Number(minExpiryMonths));
      expiryFilter.gte = minDate;
    }

    const where: Record<string, unknown> = {
      status: status as ListingStatus,
      pharmacy: {
        verificationStatus: VerificationStatus.APPROVED,
        isActive: true,
        ...(city ? { city: { equals: String(city), mode: 'insensitive' } } : {}),
        ...(district ? { district: { equals: String(district), mode: 'insensitive' } } : {}),
      },
    };

    if (pharmacyId) where.pharmacyId = String(pharmacyId);

    if (Object.keys(expiryFilter).length) where.expiryDate = expiryFilter;
    if (minPrice || maxPrice) {
      where.finalPrice = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      };
    }
    if (minDiscount) where.discountPercent = { gte: Number(minDiscount) };

    if (q || composition || company || category) {
      const medicineWhere: Record<string, unknown> = { isActive: true };
      if (q) {
        medicineWhere.OR = [
          { name: { contains: String(q), mode: 'insensitive' } },
          { genericName: { contains: String(q), mode: 'insensitive' } },
          { brandName: { contains: String(q), mode: 'insensitive' } },
        ];
      }
      if (composition) medicineWhere.composition = { contains: String(composition), mode: 'insensitive' };
      if (company) medicineWhere.company = { contains: String(company), mode: 'insensitive' };
      if (category) medicineWhere.category = String(category);
      where.medicine = medicineWhere;
    }

    const orderBy = sortBy === 'price' ? { finalPrice: sortOrder as 'asc' | 'desc' }
      : sortBy === 'expiry' ? { expiryDate: sortOrder as 'asc' | 'desc' }
      : sortBy === 'discount' ? { discountPercent: sortOrder as 'asc' | 'desc' }
      : { createdAt: sortOrder as 'asc' | 'desc' };

    const [data, total] = await Promise.all([
      prisma.listing.findMany({
        where: where as never, skip, take: limit, orderBy,
        include: {
          medicine: { select: { id: true, name: true, company: true, dosageForm: true, packSize: true, category: true, composition: true } },
          pharmacy: { select: { id: true, name: true, city: true, district: true, rating: true, verificationStatus: true, latitude: true, longitude: true, userId: true } },
        },
      }),
      prisma.listing.count({ where: where as never }),
    ]);

    return { data, total, page, limit };
  }

  async getById(id: string) {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        medicine: true,
        pharmacy: { select: { id: true, name: true, city: true, district: true, rating: true, ratingCount: true, verificationStatus: true, logoUrl: true, userId: true } },
      },
    });
    if (!listing) throw AppError.notFound('Listing not found');
    return listing;
  }

  async create(userId: string, data: Record<string, unknown>) {
    const pharmacy = await getPharmacyForUser(userId);
    const finalPrice = computeFinalPrice(Number(data.sellingPrice), Number(data.discountPercent ?? 0));

    return prisma.listing.create({
      data: {
        pharmacyId: pharmacy.id,
        medicineId: data.medicineId as string,
        batchNumber: data.batchNumber as string,
        mfgDate: new Date(data.mfgDate as string),
        expiryDate: new Date(data.expiryDate as string),
        purchasePrice: data.purchasePrice as number,
        sellingPrice: data.sellingPrice as number,
        discountPercent: Number(data.discountPercent ?? 0),
        finalPrice,
        availableQty: data.availableQty as number,
        moq: Number(data.moq ?? 1),
        unit: (data.unit as string) ?? 'strip',
        imageUrl: data.imageUrl as string | undefined,
        status: (data.status as ListingStatus) ?? ListingStatus.DRAFT,
      },
      include: { medicine: true },
    });
  }

  async update(userId: string, id: string, data: Record<string, unknown>) {
    const pharmacy = await getPharmacyForUser(userId);
    const existing = await prisma.listing.findFirst({ where: { id, pharmacyId: pharmacy.id } });
    if (!existing) throw AppError.notFound('Listing not found');

    const finalPrice = data.sellingPrice !== undefined || data.discountPercent !== undefined
      ? computeFinalPrice(
          Number(data.sellingPrice ?? existing.sellingPrice),
          Number(data.discountPercent ?? existing.discountPercent)
        )
      : undefined;

    const updateData: Record<string, unknown> = { ...data };
    if (data.mfgDate) updateData.mfgDate = new Date(data.mfgDate as string);
    if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate as string);
    if (finalPrice !== undefined) updateData.finalPrice = finalPrice;

    return prisma.listing.update({
      where: { id },
      data: updateData as never,
      include: { medicine: true },
    });
  }

  async updatePrice(userId: string, id: string, sellingPrice?: number, discountPercent?: number) {
    const pharmacy = await getPharmacyForUser(userId);
    const existing = await prisma.listing.findFirst({ where: { id, pharmacyId: pharmacy.id } });
    if (!existing) throw AppError.notFound('Listing not found');

    const newSelling = sellingPrice ?? Number(existing.sellingPrice);
    const newDiscount = discountPercent ?? existing.discountPercent;

    return prisma.listing.update({
      where: { id },
      data: {
        ...(sellingPrice !== undefined && { sellingPrice }),
        ...(discountPercent !== undefined && { discountPercent }),
        finalPrice: computeFinalPrice(newSelling, newDiscount),
      },
    });
  }

  async updateQuantity(userId: string, id: string, availableQty: number) {
    const pharmacy = await getPharmacyForUser(userId);
    const existing = await prisma.listing.findFirst({ where: { id, pharmacyId: pharmacy.id } });
    if (!existing) throw AppError.notFound('Listing not found');

    return prisma.listing.update({
      where: { id },
      data: {
        availableQty,
        status: availableQty === 0 ? ListingStatus.SOLD_OUT : existing.status === ListingStatus.SOLD_OUT ? ListingStatus.ACTIVE : existing.status,
      },
    });
  }

  async pause(userId: string, id: string) {
    const pharmacy = await getPharmacyForUser(userId);
    const existing = await prisma.listing.findFirst({ where: { id, pharmacyId: pharmacy.id } });
    if (!existing) throw AppError.notFound('Listing not found');

    return prisma.listing.update({ where: { id }, data: { status: ListingStatus.PAUSED } });
  }

  async activate(userId: string, id: string) {
    const pharmacy = await getPharmacyForUser(userId);
    const existing = await prisma.listing.findFirst({ where: { id, pharmacyId: pharmacy.id } });
    if (!existing) throw AppError.notFound('Listing not found');

    return prisma.listing.update({ where: { id }, data: { status: ListingStatus.ACTIVE } });
  }

  async delete(userId: string, id: string) {
    return this.pause(userId, id);
  }

  async getSellerListings(userId: string, query: Record<string, unknown>) {
    const pharmacy = await getPharmacyForUser(userId);
    const { page, limit, skip } = parsePagination(query);
    const status = query.status as ListingStatus | undefined;

    const where = { pharmacyId: pharmacy.id, ...(status && { status }) };
    const [data, total] = await Promise.all([
      prisma.listing.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { medicine: true },
      }),
      prisma.listing.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

export const listingService = new ListingService();
