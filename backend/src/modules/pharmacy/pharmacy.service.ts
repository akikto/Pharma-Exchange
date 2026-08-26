import { OrderStatus, VerificationStatus, ListingStatus } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { notificationService } from '../notification';

export class PharmacyService {
  async register(userId: string, data: {
    name: string; licenseNumber: string; address: string;
    city: string; district: string; postalCode?: string;
    latitude?: number; longitude?: number; description?: string;
  }) {
    const existing = await prisma.pharmacy.findUnique({ where: { userId } });
    if (existing) throw AppError.conflict('Pharmacy already registered');

    const licenseTaken = await prisma.pharmacy.findUnique({ where: { licenseNumber: data.licenseNumber } });
    if (licenseTaken) throw AppError.conflict('License number already registered');

    return prisma.pharmacy.create({
      data: { userId, ...data, verificationStatus: VerificationStatus.PENDING },
    });
  }

  async uploadDocument(userId: string, data: { type: string; fileUrl: string; fileName: string }) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId } });
    if (!pharmacy) throw AppError.notFound('Pharmacy not found. Register first.');

    const doc = await prisma.pharmacyDocument.create({
      data: { pharmacyId: pharmacy.id, type: data.type as never, fileUrl: data.fileUrl, fileName: data.fileName },
    });

    const docCount = await prisma.pharmacyDocument.count({ where: { pharmacyId: pharmacy.id } });
    if (docCount >= 1 && pharmacy.verificationStatus === VerificationStatus.PENDING) {
      await prisma.pharmacy.update({
        where: { id: pharmacy.id },
        data: { verificationStatus: VerificationStatus.UNDER_REVIEW },
      });
    }

    return doc;
  }

  async getMyPharmacy(userId: string) {
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { userId },
      include: { documents: true },
    });
    if (!pharmacy) throw AppError.notFound('Pharmacy not found');
    return pharmacy;
  }

  async getPublicProfile(id: string) {
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id },
      select: {
        id: true, name: true, city: true, district: true, address: true, postalCode: true,
        description: true, logoUrl: true, rating: true, ratingCount: true, verificationStatus: true,
        licenseNumber: true, latitude: true, longitude: true, createdAt: true,
        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });
    if (!pharmacy) throw AppError.notFound('Pharmacy not found');

    const dealsCompleted = await prisma.order.count({
      where: { sellerId: id, status: OrderStatus.DELIVERED },
    });

    const { user, ...rest } = pharmacy;
    return {
      ...rest,
      owner: user
        ? { id: user.id, name: `${user.firstName} ${user.lastName}`.trim(), phone: user.phone }
        : null,
      dealsCompleted,
    };
  }

  async listDemoShops() {
    return prisma.pharmacy.findMany({
      where: { verificationStatus: VerificationStatus.APPROVED, isActive: true },
      select: {
        id: true, name: true, city: true, district: true, logoUrl: true,
        rating: true, verificationStatus: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async adminVerify(pharmacyId: string, action: 'approve' | 'reject', rejectionReason?: string) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy) throw AppError.notFound('Pharmacy not found');

    const updated = await prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        verificationStatus: action === 'approve' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
        rejectionReason: action === 'reject' ? rejectionReason : null,
      },
    });

    await notificationService.create({
      userId: pharmacy.userId,
      type: 'VERIFICATION',
      title: action === 'approve' ? 'Pharmacy Verified' : 'Verification Rejected',
      body: action === 'approve'
        ? 'Your pharmacy has been verified. You can now list medicines.'
        : `Verification rejected: ${rejectionReason ?? 'Please resubmit documents.'}`,
      data: { pharmacyId },
      forcePush: true,
    });

    return updated;
  }

  async getVerificationQueue(status: VerificationStatus, page: number, limit: number, skip: number) {
    const where = { verificationStatus: status };
    const [data, total] = await Promise.all([
      prisma.pharmacy.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'asc' },
        include: {
          documents: true,
          user: { select: { id: true, email: true, phone: true, firstName: true, lastName: true } },
        },
      }),
      prisma.pharmacy.count({ where }),
    ]);
    return { data, total };
  }

  async listForAdmin(params: {
    q?: string;
    verificationStatus?: VerificationStatus;
    isActive?: boolean;
    page: number;
    limit: number;
    skip: number;
  }) {
    const { q, verificationStatus, isActive, page, limit, skip } = params;
    const where: {
      verificationStatus?: VerificationStatus;
      isActive?: boolean;
      OR?: Array<Record<string, unknown>>;
    } = {};
    if (verificationStatus) where.verificationStatus = verificationStatus;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (q?.trim()) {
      const term = q.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { city: { contains: term, mode: 'insensitive' } },
        { licenseNumber: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { phone: { contains: term } } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.pharmacy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          city: true,
          district: true,
          licenseNumber: true,
          verificationStatus: true,
          isActive: true,
          rating: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: { select: { listings: true } },
        },
      }),
      prisma.pharmacy.count({ where }),
    ]);

    const data = rows.map(({ _count, user, ...pharmacy }) => ({
      ...pharmacy,
      listingCount: _count.listings,
      owner: user
        ? {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: `${user.firstName} ${user.lastName}`.trim(),
          }
        : null,
    }));

    return { data, total, page, limit };
  }

  async getForAdmin(pharmacyId: string) {
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      include: {
        documents: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: { select: { listings: true, ordersAsSeller: true } },
      },
    });
    if (!pharmacy) throw AppError.notFound('Pharmacy not found');

    const [activeListings, orderCount, buyRequestCount, reviewCount] = await Promise.all([
      prisma.listing.count({
        where: { pharmacyId, status: ListingStatus.ACTIVE },
      }),
      prisma.order.count({ where: { sellerId: pharmacyId } }),
      prisma.buyRequest.count({ where: { sellerId: pharmacyId } }),
      prisma.review.count({ where: { pharmacyId } }),
    ]);

    const canPermanentlyDelete = orderCount === 0 && buyRequestCount === 0 && reviewCount === 0;

    const { _count, user, ...rest } = pharmacy;
    return {
      ...rest,
      owner: user
        ? {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: `${user.firstName} ${user.lastName}`.trim(),
            isActive: user.isActive,
            createdAt: user.createdAt,
          }
        : null,
      listingCount: _count.listings,
      activeListingCount: activeListings,
      orderCount,
      buyRequestCount,
      reviewCount,
      canPermanentlyDelete,
    };
  }

  async adminUpdate(
    pharmacyId: string,
    data: {
      isActive?: boolean;
      name?: string;
      licenseNumber?: string;
      address?: string;
      city?: string;
      district?: string;
      postalCode?: string | null;
      description?: string | null;
      ownerPhone?: string | null;
    },
  ) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy) throw AppError.notFound('Pharmacy not found');

    const updates: Record<string, unknown> = {};
    if (typeof data.isActive === 'boolean') updates.isActive = data.isActive;
    if (data.name !== undefined) updates.name = data.name;
    if (data.licenseNumber !== undefined) updates.licenseNumber = data.licenseNumber;
    if (data.address !== undefined) updates.address = data.address;
    if (data.city !== undefined) updates.city = data.city;
    if (data.district !== undefined) updates.district = data.district;
    if (data.postalCode !== undefined) updates.postalCode = data.postalCode;
    if (data.description !== undefined) updates.description = data.description;

    if (Object.keys(updates).length === 0 && data.ownerPhone === undefined) {
      throw AppError.badRequest('No valid fields to update');
    }

    if (data.licenseNumber !== undefined) {
      const licenseTaken = await prisma.pharmacy.findFirst({
        where: { licenseNumber: data.licenseNumber, NOT: { id: pharmacyId } },
      });
      if (licenseTaken) throw AppError.conflict('License number already registered');
    }

    if (data.ownerPhone !== undefined) {
      const phone = data.ownerPhone?.trim() || null;
      if (phone) {
        const phoneTaken = await prisma.user.findFirst({
          where: { phone, NOT: { id: pharmacy.userId } },
        });
        if (phoneTaken) throw AppError.conflict('Phone number already registered');
      }
      await prisma.user.update({
        where: { id: pharmacy.userId },
        data: { phone },
      });
    }

    if (Object.keys(updates).length > 0) {
      await prisma.pharmacy.update({
        where: { id: pharmacyId },
        data: updates,
      });
    }

    if (data.isActive === false) {
      await notificationService.create({
        userId: pharmacy.userId,
        type: 'VERIFICATION',
        title: 'Pharmacy account suspended',
        body: 'Your pharmacy has been deactivated by an administrator. Contact support if you believe this is an error.',
        data: { pharmacyId },
        forcePush: true,
      });
    }

    return this.getForAdmin(pharmacyId);
  }

  /**
   * Hard-delete pharmacy only when no orders, buy requests, or reviews exist (financial/audit history preserved).
   * Listings, documents, and bulk requests cascade via Prisma schema.
   */
  async adminDeletePermanent(pharmacyId: string, confirmName: string) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy) throw AppError.notFound('Pharmacy not found');

    if (confirmName.trim() !== pharmacy.name) {
      throw AppError.badRequest('Confirmation name does not match pharmacy name');
    }

    const [orderCount, buyRequestCount, reviewCount] = await Promise.all([
      prisma.order.count({ where: { sellerId: pharmacyId } }),
      prisma.buyRequest.count({ where: { sellerId: pharmacyId } }),
      prisma.review.count({ where: { pharmacyId } }),
    ]);

    if (orderCount > 0 || buyRequestCount > 0 || reviewCount > 0) {
      throw AppError.conflict(
        'Cannot permanently delete a seller with order, buy-request, or review history. Suspend the account instead.',
      );
    }

    await prisma.pharmacy.delete({ where: { id: pharmacyId } });

    return { deleted: true, id: pharmacyId };
  }
}

export const pharmacyService = new PharmacyService();
