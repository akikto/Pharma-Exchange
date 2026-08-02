import { ListingStatus, OrderStatus, VerificationStatus } from '@prisma/client';
import prisma from '../../config/database';

export class AnalyticsService {
  async getSellerAnalytics(userId: string) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId } });
    if (!pharmacy) return null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalSales,
      pendingRequests,
      activeListings,
      recentOrders,
      shortExpiryListings,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { sellerId: pharmacy.id, status: OrderStatus.DELIVERED, deliveredAt: { gte: thirtyDaysAgo } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.buyRequest.count({ where: { sellerId: pharmacy.id, status: 'PENDING' } }),
      prisma.listing.count({ where: { pharmacyId: pharmacy.id, status: ListingStatus.ACTIVE } }),
      prisma.order.findMany({
        where: { sellerId: pharmacy.id },
        take: 5, orderBy: { createdAt: 'desc' },
        select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
      }),
      prisma.listing.count({
        where: {
          pharmacyId: pharmacy.id,
          status: ListingStatus.ACTIVE,
          expiryDate: { lte: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      todaySales: totalSales._sum.totalAmount ?? 0,
      orderCount: totalSales._count,
      pendingBuyRequests: pendingRequests,
      activeListings,
      shortExpiryAlert: shortExpiryListings,
      recentOrders,
      rating: pharmacy.rating,
    };
  }

  async getPlatformAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      gmv,
      activePharmacies,
      pendingVerifications,
      openReports,
      totalOrders,
      activeListings,
      topMedicines,
      ordersOverTime,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: OrderStatus.DELIVERED, deliveredAt: { gte: thirtyDaysAgo } },
        _sum: { totalAmount: true },
      }),
      prisma.pharmacy.count({ where: { verificationStatus: VerificationStatus.APPROVED, isActive: true } }),
      prisma.pharmacy.count({ where: { verificationStatus: { in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] } } }),
      prisma.report.count({ where: { status: 'OPEN' } }),
      prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
      prisma.orderItem.groupBy({
        by: ['medicineName'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM "Order"
        WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    return {
      gmv: gmv._sum.totalAmount ?? 0,
      activePharmacies,
      pendingVerifications,
      openReports,
      totalOrders,
      activeListings,
      topMedicines,
      ordersOverTime,
    };
  }
}

export const analyticsService = new AnalyticsService();
