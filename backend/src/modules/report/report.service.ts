import { ReportStatus, ReportTargetType } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { parsePagination } from '../../shared/utils/helpers';

export class ReportService {
  async submit(reporterId: string, data: { targetType: ReportTargetType; targetId: string; reason: string; description?: string }) {
    return prisma.report.create({
      data: {
        reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description,
      },
    });
  }

  async list(status: ReportStatus, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { status };
    const [data, total] = await Promise.all([
      prisma.report.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'asc' },
        include: { reporter: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.report.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async resolve(reportId: string, reviewerId: string, status: ReportStatus, resolution?: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw AppError.notFound('Report not found');

    return prisma.report.update({
      where: { id: reportId },
      data: { status, resolution, reviewedById: reviewerId },
    });
  }
}

export const reportService = new ReportService();
