import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { parsePagination } from '../../shared/utils/helpers';
import { storageService } from '../upload/storage.service';

export class MedicineService {
  async search(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const { q, category, company, composition } = query;

    const where: Record<string, unknown> = { isActive: true };

    if (q) {
      const term = String(q);
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { genericName: { contains: term, mode: 'insensitive' } },
        { brandName: { contains: term, mode: 'insensitive' } },
        { composition: { contains: term, mode: 'insensitive' } },
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

  async getAlternatives(id: string) {
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) throw AppError.notFound('Medicine not found');
    if (!medicine.genericName) return { data: [], total: 0 };

    const data = await prisma.medicine.findMany({
      where: {
        isActive: true,
        id: { not: id },
        genericName: { equals: medicine.genericName, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
      take: 20,
    });

    return { data, total: data.length };
  }

  async create(data: Record<string, unknown>) {
    return prisma.medicine.create({ data: data as never });
  }

  async update(id: string, data: Record<string, unknown>) {
    const existing = await prisma.medicine.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Medicine not found');
    const updated = await prisma.medicine.update({ where: { id }, data: data as never });

    const nextImageUrl = typeof data.imageUrl === 'string' ? data.imageUrl : undefined;
    if (nextImageUrl && existing.imageUrl && nextImageUrl !== existing.imageUrl) {
      await this.cleanupImageIfUnreferenced(existing.imageUrl);
    }

    return updated;
  }

  async countImageReferences(imageUrl: string): Promise<number> {
    const [medicineCount, listingCount] = await Promise.all([
      prisma.medicine.count({ where: { imageUrl } }),
      prisma.listing.count({ where: { imageUrl } }),
    ]);
    return medicineCount + listingCount;
  }

  async cleanupImageIfUnreferenced(imageUrl: string): Promise<void> {
    if (!imageUrl) return;
    const references = await this.countImageReferences(imageUrl);
    if (references > 0) return;
    await storageService.deleteFile(imageUrl);
  }
}

export const medicineService = new MedicineService();
