import { ListingStatus, VerificationStatus } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { computeFinalPrice, parsePagination } from '../../shared/utils/helpers';
import { haversineKm } from '../../shared/utils/geo';
import { getPharmacyForUser } from '../../shared/middleware/pharmacy.middleware';
import { priceAlertService } from '../watchlist/priceAlert.service';

type SearchQuery = Record<string, unknown>;

const DEFAULT_LOW_STOCK_THRESHOLD = 20;

export function resolveLowStockThreshold(listing: { availableQty: number; moq: number; lowStockThreshold?: number | null }): number {
  if (listing.lowStockThreshold != null) return listing.lowStockThreshold;
  return Math.max(listing.moq * 2, DEFAULT_LOW_STOCK_THRESHOLD);
}

export function isListingLowStock(listing: { availableQty: number; moq: number; lowStockThreshold?: number | null; status: ListingStatus }): boolean {
  return listing.status === ListingStatus.ACTIVE && listing.availableQty <= resolveLowStockThreshold(listing);
}

/** Sellers cannot upload or override listing images; catalog images come from Medicine. */
function stripSellerImageUrlOverride(data: Record<string, unknown>): Record<string, unknown> {
  const { imageUrl: _ignored, ...rest } = data;
  return rest;
}

export class ListingService {
  async search(query: SearchQuery) {
    const { page, limit, skip } = parsePagination(query);
    const {
      q, composition, company, category, city, district, pharmacyId,
      minPrice, maxPrice, minDiscount, maxExpiryMonths, minExpiryMonths, maxExpiryDays,
      dosageForm, minRating, verifiedOnly, inStockOnly, minAvailableQty,
      sortBy = 'createdAt', sortOrder = 'desc', status = ListingStatus.ACTIVE,
      latitude, longitude, radiusKm = 2,
    } = query;

    const userLat = latitude !== undefined ? Number(latitude) : undefined;
    const userLng = longitude !== undefined ? Number(longitude) : undefined;
    const radius = Number(radiusKm);

    const now = new Date();
    const expiryFilter: Record<string, Date> = {};
    if (maxExpiryDays) {
      const maxDate = new Date(now);
      maxDate.setDate(maxDate.getDate() + Number(maxExpiryDays));
      expiryFilter.lte = maxDate;
    } else if (maxExpiryMonths) {
      const maxDate = new Date(now);
      maxDate.setMonth(maxDate.getMonth() + Number(maxExpiryMonths));
      expiryFilter.lte = maxDate;
    }
    if (minExpiryMonths) {
      const minDate = new Date(now);
      minDate.setMonth(minDate.getMonth() + Number(minExpiryMonths));
      expiryFilter.gte = minDate;
    }

    let nearbyPharmacyIds: string[] | undefined;
    if (userLat !== undefined && userLng !== undefined && !Number.isNaN(userLat) && !Number.isNaN(userLng)) {
      const pharmacies = await prisma.pharmacy.findMany({
        where: {
          verificationStatus: VerificationStatus.APPROVED,
          isActive: true,
          latitude: { not: null },
          longitude: { not: null },
        },
        select: { id: true, latitude: true, longitude: true },
      });
      nearbyPharmacyIds = pharmacies
        .filter((p) => haversineKm(userLat, userLng, Number(p.latitude), Number(p.longitude)) <= radius)
        .map((p) => p.id);
      if (nearbyPharmacyIds.length === 0) {
        return { data: [], total: 0, page, limit };
      }
    }

    const pharmacyWhere: Record<string, unknown> = {
      verificationStatus: VerificationStatus.APPROVED,
      isActive: true,
      ...(city ? { city: { equals: String(city), mode: 'insensitive' } } : {}),
      ...(district ? { district: { equals: String(district), mode: 'insensitive' } } : {}),
      ...(minRating ? { rating: { gte: Number(minRating) } } : {}),
      ...(verifiedOnly ? { verificationStatus: VerificationStatus.APPROVED } : {}),
      ...(nearbyPharmacyIds ? { id: { in: nearbyPharmacyIds } } : {}),
    };

    const where: Record<string, unknown> = {
      status: status as ListingStatus,
      pharmacy: pharmacyWhere,
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
    if (inStockOnly) where.availableQty = { gt: 0 };
    if (minAvailableQty) where.availableQty = { gte: Number(minAvailableQty) };

    const medicineWhere: Record<string, unknown> = { isActive: true };
    let hasMedicineFilter = false;

    if (q) {
      hasMedicineFilter = true;
      medicineWhere.OR = [
        { name: { contains: String(q), mode: 'insensitive' } },
        { genericName: { contains: String(q), mode: 'insensitive' } },
        { brandName: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    if (composition) {
      hasMedicineFilter = true;
      medicineWhere.composition = { contains: String(composition), mode: 'insensitive' };
    }
    if (company) {
      hasMedicineFilter = true;
      medicineWhere.company = { contains: String(company), mode: 'insensitive' };
    }
    if (category) {
      hasMedicineFilter = true;
      medicineWhere.category = { contains: String(category), mode: 'insensitive' };
    }
    if (dosageForm) {
      hasMedicineFilter = true;
      medicineWhere.dosageForm = dosageForm;
    }
    if (hasMedicineFilter) where.medicine = medicineWhere;

    const orderBy =
      sortBy === 'price' ? { finalPrice: sortOrder as 'asc' | 'desc' }
      : sortBy === 'expiry' ? { expiryDate: sortOrder as 'asc' | 'desc' }
      : sortBy === 'discount' ? { discountPercent: sortOrder as 'asc' | 'desc' }
      : sortBy === 'rating' ? { pharmacy: { rating: sortOrder as 'asc' | 'desc' } }
      : sortBy === 'recommended' ? [{ discountPercent: 'desc' as const }, { pharmacy: { rating: 'desc' as const } }, { createdAt: 'desc' as const }]
      : { createdAt: sortOrder as 'asc' | 'desc' };

    const include = {
      medicine: { select: { id: true, name: true, company: true, dosageForm: true, packSize: true, category: true, composition: true, genericName: true, brandName: true, imageUrl: true, strength: true } },
      pharmacy: { select: { id: true, name: true, city: true, district: true, rating: true, verificationStatus: true, latitude: true, longitude: true, userId: true } },
    };

    let data = await prisma.listing.findMany({
      where: where as never,
      skip: sortBy === 'distance' ? 0 : skip,
      take: sortBy === 'distance' ? 500 : limit,
      orderBy: sortBy === 'distance' ? { createdAt: 'desc' } : orderBy,
      include,
    });

    let total = await prisma.listing.count({ where: where as never });

    if (sortBy === 'distance' && userLat !== undefined && userLng !== undefined) {
      data = data
        .map((listing) => ({
          listing,
          distanceKm: listing.pharmacy.latitude != null && listing.pharmacy.longitude != null
            ? haversineKm(userLat, userLng, Number(listing.pharmacy.latitude), Number(listing.pharmacy.longitude))
            : Number.POSITIVE_INFINITY,
        }))
        .sort((a, b) => (sortOrder === 'asc' ? a.distanceKm - b.distanceKm : b.distanceKm - a.distanceKm))
        .map(({ listing, distanceKm }) => ({ ...listing, distanceKm: distanceKm === Number.POSITIVE_INFINITY ? null : distanceKm }));
      total = data.length;
      data = data.slice(skip, skip + limit);
    }

    return { data, total, page, limit };
  }

  async compareByMedicine(query: Record<string, unknown>) {
    const { medicineId, sortBy = 'price', latitude, longitude } = query;
    const userLat = latitude !== undefined ? Number(latitude) : undefined;
    const userLng = longitude !== undefined ? Number(longitude) : undefined;

    const medicine = await prisma.medicine.findUnique({ where: { id: String(medicineId) } });
    if (!medicine) throw AppError.notFound('Medicine not found');

    const include = {
      medicine: {
        select: {
          id: true, name: true, company: true, dosageForm: true, packSize: true,
          category: true, composition: true, genericName: true, brandName: true, imageUrl: true,
        },
      },
      pharmacy: {
        select: {
          id: true, name: true, city: true, district: true, rating: true, ratingCount: true,
          verificationStatus: true, logoUrl: true, userId: true, latitude: true, longitude: true,
          user: { select: { id: true, phone: true } },
        },
      },
    };

    let listings = await prisma.listing.findMany({
      where: {
        medicineId: String(medicineId),
        status: ListingStatus.ACTIVE,
        pharmacy: { verificationStatus: VerificationStatus.APPROVED, isActive: true },
      },
      include,
      orderBy: { finalPrice: 'asc' },
    });

    if (listings.length === 0) {
      return { medicine, listings: [], stats: { sellerCount: 0, lowestPrice: 0, highestPrice: 0 } };
    }

    const withDistance = listings.map((listing) => {
      let distanceKm: number | null = null;
      if (
        userLat !== undefined && userLng !== undefined
        && listing.pharmacy.latitude != null && listing.pharmacy.longitude != null
      ) {
        distanceKm = haversineKm(
          userLat, userLng,
          Number(listing.pharmacy.latitude), Number(listing.pharmacy.longitude),
        );
      }
      return { ...listing, distanceKm };
    });

    const sorted = [...withDistance].sort((a, b) => {
      if (sortBy === 'expiry') {
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      }
      if (sortBy === 'distance') {
        const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
        return da - db;
      }
      return Number(a.finalPrice) - Number(b.finalPrice);
    });

    const prices = sorted.map((l) => Number(l.finalPrice));
    const sellerCount = new Set(sorted.map((l) => l.pharmacy.id)).size;

    return {
      medicine,
      listings: sorted,
      stats: {
        sellerCount,
        lowestPrice: Math.min(...prices),
        highestPrice: Math.max(...prices),
      },
    };
  }

  async getById(id: string) {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        medicine: true,
        pharmacy: {
          select: {
            id: true, name: true, city: true, district: true, rating: true, ratingCount: true,
            verificationStatus: true, logoUrl: true, userId: true, latitude: true, longitude: true,
            user: { select: { id: true, phone: true } },
          },
        },
      },
    });
    if (!listing) throw AppError.notFound('Listing not found');
    return listing;
  }

  async create(userId: string, data: Record<string, unknown>) {
    const pharmacy = await getPharmacyForUser(userId);
    const sellerData = stripSellerImageUrlOverride(data);
    const finalPrice = computeFinalPrice(Number(sellerData.sellingPrice), Number(sellerData.discountPercent ?? 0));

    const listing = await prisma.listing.create({
      data: {
        pharmacyId: pharmacy.id,
        medicineId: sellerData.medicineId as string,
        batchNumber: sellerData.batchNumber as string,
        mfgDate: new Date(sellerData.mfgDate as string),
        expiryDate: new Date(sellerData.expiryDate as string),
        purchasePrice: sellerData.purchasePrice as number,
        sellingPrice: sellerData.sellingPrice as number,
        discountPercent: Number(sellerData.discountPercent ?? 0),
        finalPrice,
        availableQty: sellerData.availableQty as number,
        moq: Number(sellerData.moq ?? 1),
        unit: (sellerData.unit as string) ?? 'strip',
        lowStockThreshold: sellerData.lowStockThreshold != null ? Number(sellerData.lowStockThreshold) : undefined,
        status: (sellerData.status as ListingStatus) ?? ListingStatus.DRAFT,
      },
      include: { medicine: true },
    });

    if (listing.status === ListingStatus.ACTIVE) {
      await priceAlertService.evaluateListing(listing).catch(() => undefined);
    }

    return listing;
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

    const updateData: Record<string, unknown> = stripSellerImageUrlOverride({ ...data });
    if (data.mfgDate) updateData.mfgDate = new Date(data.mfgDate as string);
    if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate as string);
    if (finalPrice !== undefined) updateData.finalPrice = finalPrice;

    const updated = await prisma.listing.update({
      where: { id },
      data: updateData as never,
      include: { medicine: true },
    });

    if (updated.status === ListingStatus.ACTIVE) {
      await priceAlertService.evaluateListing(updated).catch(() => undefined);
    }

    return updated;
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

  async restock(userId: string, id: string, amount = 50) {
    const pharmacy = await getPharmacyForUser(userId);
    const existing = await prisma.listing.findFirst({ where: { id, pharmacyId: pharmacy.id } });
    if (!existing) throw AppError.notFound('Listing not found');

    const availableQty = existing.availableQty + amount;
    return prisma.listing.update({
      where: { id },
      data: {
        availableQty,
        status: existing.status === ListingStatus.SOLD_OUT ? ListingStatus.ACTIVE : existing.status,
      },
      include: { medicine: true },
    });
  }

  async markSoldOut(userId: string, id: string) {
    const pharmacy = await getPharmacyForUser(userId);
    const existing = await prisma.listing.findFirst({ where: { id, pharmacyId: pharmacy.id } });
    if (!existing) throw AppError.notFound('Listing not found');

    return prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.SOLD_OUT, availableQty: 0 },
      include: { medicine: true },
    });
  }

  async getInventoryStats(userId: string) {
    const pharmacy = await getPharmacyForUser(userId);
    const listings = await prisma.listing.findMany({
      where: { pharmacyId: pharmacy.id },
      select: { status: true, availableQty: true, moq: true, lowStockThreshold: true },
    });

    let active = 0;
    let paused = 0;
    let soldOut = 0;
    let lowStock = 0;
    for (const listing of listings) {
      if (listing.status === ListingStatus.ACTIVE) active += 1;
      if (listing.status === ListingStatus.PAUSED) paused += 1;
      if (listing.status === ListingStatus.SOLD_OUT) soldOut += 1;
      if (isListingLowStock({ ...listing, status: listing.status })) lowStock += 1;
    }

    return { active, paused, soldOut, lowStock, total: listings.length };
  }

  async exportInventoryCsv(userId: string): Promise<string> {
    const pharmacy = await getPharmacyForUser(userId);
    const listings = await prisma.listing.findMany({
      where: { pharmacyId: pharmacy.id },
      orderBy: { createdAt: 'desc' },
      include: { medicine: true },
    });

    const header = 'Medicine,Generic,Company,Batch,Status,Qty,MOQ,LowStockThreshold,Price,Expiry';
    const rows = listings.map((l) => [
      l.medicine.name,
      l.medicine.genericName ?? '',
      l.medicine.company,
      l.batchNumber,
      l.status,
      l.availableQty,
      l.moq,
      l.lowStockThreshold ?? '',
      Number(l.finalPrice).toFixed(2),
      l.expiryDate.toISOString().slice(0, 10),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));

    return [header, ...rows].join('\n');
  }

  async getSellerListings(userId: string, query: Record<string, unknown>) {
    const pharmacy = await getPharmacyForUser(userId);
    const { page, limit, skip } = parsePagination(query);
    const status = query.status as ListingStatus | undefined;
    const q = typeof query.q === 'string' ? query.q.trim() : '';
    const filter = typeof query.filter === 'string' ? query.filter : undefined;

    const where: Record<string, unknown> = { pharmacyId: pharmacy.id };
    if (status) where.status = status;

    if (q) {
      where.OR = [
        { batchNumber: { contains: q, mode: 'insensitive' } },
        { medicine: { name: { contains: q, mode: 'insensitive' } } },
        { medicine: { genericName: { contains: q, mode: 'insensitive' } } },
        { medicine: { company: { contains: q, mode: 'insensitive' } } },
      ];
    }

    let data = await prisma.listing.findMany({
      where: where as never,
      orderBy: { createdAt: 'desc' },
      include: { medicine: true },
    });

    if (filter === 'low_stock') {
      data = data.filter((l) => isListingLowStock(l));
    }

    const total = data.length;
    const paged = data.slice(skip, skip + limit);

    return { data: paged, total, page, limit };
  }
}

export const listingService = new ListingService();
