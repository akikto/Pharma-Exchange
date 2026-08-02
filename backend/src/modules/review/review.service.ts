import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';

export class ReviewService {
  async create(reviewerId: string, orderId: string, rating: number, comment?: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId: reviewerId, status: 'DELIVERED' },
    });
    if (!order) throw AppError.badRequest('Order not found or not yet delivered');

    const existing = await prisma.review.findUnique({ where: { orderId } });
    if (existing) throw AppError.conflict('Review already submitted');

    const review = await prisma.review.create({
      data: { orderId, reviewerId, pharmacyId: order.sellerId, rating, comment },
    });

    const stats = await prisma.review.aggregate({
      where: { pharmacyId: order.sellerId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.pharmacy.update({
      where: { id: order.sellerId },
      data: { rating: stats._avg.rating ?? 0, ratingCount: stats._count },
    });

    return review;
  }

  async getPharmacyReviews(pharmacyId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.review.findMany({
        where: { pharmacyId },
        skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { reviewer: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.review.count({ where: { pharmacyId } }),
    ]);
    return { data, total, page, limit };
  }
}

export const reviewService = new ReviewService();
