import { BannerActionType, BannerMediaType, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { assertValidPersistableMediaUrl, describeMediaUrlForDiagnostics, isBrokenPersistedBannerMediaUrl } from '../upload/media-url';
import { logger } from '../../shared/utils/logger';

export type PublicBannerDto = {
  id: string;
  title: string;
  subtitle: string | null;
  mediaUrl: string;
  mediaType: BannerMediaType;
  mediaAlt: string | null;
  ctaText: string | null;
  actionType: BannerActionType;
  actionTarget: string | null;
};

function toPublicDto(banner: Prisma.HomeBannerGetPayload<object>): PublicBannerDto {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    mediaUrl: banner.mediaUrl,
    mediaType: banner.mediaType,
    mediaAlt: banner.mediaAlt,
    ctaText: banner.ctaText,
    actionType: banner.actionType,
    actionTarget: banner.actionTarget,
  };
}

async function assertActionTarget(actionType: BannerActionType, actionTarget?: string | null) {
  const target = actionTarget?.trim();
  if (actionType === BannerActionType.MEDICINE && target) {
    const medicine = await prisma.medicine.findUnique({ where: { id: target } });
    if (!medicine) throw AppError.badRequest('Medicine not found for banner action');
  }
  if (actionType === BannerActionType.PHARMACY && target) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: target } });
    if (!pharmacy) throw AppError.badRequest('Pharmacy not found for banner action');
  }
  if (actionType === BannerActionType.CATEGORY && target) {
    if (target.length > 120) throw AppError.badRequest('Category value is too long');
  }
}

function assertBannerMediaUrl(mediaUrl: string) {
  try {
    assertValidPersistableMediaUrl(mediaUrl);
  } catch (error) {
    logger.warn('[banner] Rejected mediaUrl for persistence', describeMediaUrlForDiagnostics(mediaUrl));
    throw AppError.badRequest(error instanceof Error ? error.message : 'Invalid banner media URL');
  }
}

export class BannerService {
  async listActive(): Promise<PublicBannerDto[]> {
    const banners = await prisma.homeBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return banners.map(toPublicDto);
  }

  async listAdmin() {
    return prisma.homeBanner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getById(id: string) {
    const banner = await prisma.homeBanner.findUnique({ where: { id } });
    if (!banner) throw AppError.notFound('Banner not found');
    return banner;
  }

  async create(input: {
    title: string;
    subtitle?: string | null;
    mediaUrl: string;
    mediaType: BannerMediaType;
    mediaAlt?: string | null;
    ctaText?: string | null;
    actionType?: BannerActionType;
    actionTarget?: string | null;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const actionType = input.actionType ?? BannerActionType.NONE;
    await assertActionTarget(actionType, input.actionTarget);
    assertBannerMediaUrl(input.mediaUrl);
    const maxOrder = await prisma.homeBanner.aggregate({ _max: { sortOrder: true } });
    const sortOrder = input.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;
    return prisma.homeBanner.create({
      data: {
        title: input.title,
        subtitle: input.subtitle ?? null,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType,
        mediaAlt: input.mediaAlt ?? null,
        ctaText: input.ctaText ?? null,
        actionType,
        actionTarget: input.actionTarget ?? null,
        isActive: input.isActive ?? true,
        sortOrder,
      },
    });
  }

  async update(id: string, data: Prisma.HomeBannerUpdateInput) {
    const existing = await this.getById(id);
    if (typeof data.mediaUrl === 'string') {
      assertBannerMediaUrl(data.mediaUrl);
    }
    const actionType = (data.actionType as BannerActionType | undefined) ?? existing.actionType;
    const actionTarget =
      data.actionTarget !== undefined ? (data.actionTarget as string | null) : existing.actionTarget;
    await assertActionTarget(actionType, actionTarget);
    return prisma.homeBanner.update({ where: { id }, data });
  }

  async auditMediaUrls() {
    const banners = await prisma.homeBanner.findMany({
      select: { id: true, title: true, mediaUrl: true, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return banners
      .filter((banner) => isBrokenPersistedBannerMediaUrl(banner.mediaUrl))
      .map((banner) => ({
        id: banner.id,
        title: banner.title,
        isActive: banner.isActive,
        ...describeMediaUrlForDiagnostics(banner.mediaUrl),
      }));
  }

  async delete(id: string) {
    await this.getById(id);
    await prisma.homeBanner.delete({ where: { id } });
  }

  async reorder(orderedIds: string[]) {
    const existing = await prisma.homeBanner.findMany({ select: { id: true } });
    const existingIds = new Set(existing.map((b) => b.id));
    if (orderedIds.length !== existing.length || orderedIds.some((id) => !existingIds.has(id))) {
      throw AppError.badRequest('orderedIds must include every banner exactly once');
    }
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.homeBanner.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    return this.listAdmin();
  }
}

export const bannerService = new BannerService();
