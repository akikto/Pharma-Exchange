import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { parsePagination } from '../../shared/utils/helpers';

export class MedicineService {
  async search(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const { q, category, company, composition } = query;

    const where: Record<string, unknown> = { isActive: true };

    if (q) {
      where.OR = [
        { name: { contains: String(q), mode: 'insensitive' } },
        { genericName: { contains: String(q), mode: 'insensitive' } },
        { brandName: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    if (composition) where.composition = { contains: String(composition), mode: 'insensitive' };
    if (category) where.category = String(category);
    if (company) where.company = { contains: String(company), mode: 'insensitive' };

    const [data, total] = await Promise.all([
      prisma.medicine.findMany({ where: where as never, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.medicine.count({ where: where as never }),
    ]);

    return { data, total, page, limit };
  }

  async getById(id: string) {
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) throw AppError.notFound('Medicine not found');
    return medicine;
  }

  async create(data: Record<string, unknown>) {
    return prisma.medicine.create({ data: data as never });
  }

  async update(id: string, data: Record<string, unknown>) {
    const existing = await prisma.medicine.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Medicine not found');
    return prisma.medicine.update({ where: { id }, data: data as never });
  }
}

export const medicineService = new MedicineService();
