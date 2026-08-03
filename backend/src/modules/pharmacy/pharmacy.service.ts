import { OrderStatus, VerificationStatus } from '@prisma/client';
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
}

export const pharmacyService = new PharmacyService();
