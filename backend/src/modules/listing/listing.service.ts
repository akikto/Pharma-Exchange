import { ListingStatus, VerificationStatus } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { computeFinalPrice, parsePagination } from '../../shared/utils/helpers';
import { haversineKm } from '../../shared/utils/geo';
import { getPharmacyForUser } from '../../shared/middleware/pharmacy.middleware';

type SearchQuery = Record<string, unknown>;

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
      medicine: { select: { id: true, name: true, company: true, dosageForm: true, packSize: true, category: true, composition: true, genericName: true, brandName: true } },
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
