import {
  BannerActionType,
  BannerMediaType,
  BannerStatus,
  BannerType,
  Prisma,
} from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { getPharmacyForUser } from '../../shared/middleware/pharmacy.middleware';
import {
  assertValidPersistableMediaUrl,
  describeMediaUrlForDiagnostics,
  isBrokenPersistedBannerMediaUrl,
} from '../upload/media-url';
import { logger } from '../../shared/utils/logger';
import {
  BannerUserLocation,
  filterAndRankBannersWithFallback,
  resolveBannerPublicStatus,
} from './banner-targeting';

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
  bannerType: BannerType;
  isSponsored: boolean;
};

const bannerInclude = {
  advertiserPharmacy: {
    select: { id: true, name: true, city: true, district: true, verificationStatus: true },
  },
  approvedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
} satisfies Prisma.HomeBannerInclude;

type BannerRecord = Prisma.HomeBannerGetPayload<{ include: typeof bannerInclude }>;

function toPublicDto(banner: BannerRecord): PublicBannerDto {
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
    bannerType: banner.bannerType,
    isSponsored: banner.bannerType === BannerType.SELLER_AD,
  };
}

async function assertActionTarget(
  actionType: BannerActionType,
  actionTarget?: string | null,
  options?: { pharmacyId?: string },
) {
  const target = actionTarget?.trim();
  if (actionType === BannerActionType.MEDICINE && target) {
    const medicine = await prisma.medicine.findUnique({ where: { id: target } });
    if (!medicine) throw AppError.badRequest('Medicine not found for banner action');
  }
  if (actionType === BannerActionType.PHARMACY && target) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: target } });
    if (!pharmacy) throw AppError.badRequest('Pharmacy not found for banner action');
    if (options?.pharmacyId && pharmacy.id !== options.pharmacyId) {
      throw AppError.forbidden('Cannot advertise another pharmacy');
    }
  }
  if (actionType === BannerActionType.CATEGORY && target) {
    if (target.length > 120) throw AppError.badRequest('Category value is too long');
  }
  if (actionType === BannerActionType.LISTING && target) {
    const listing = await prisma.listing.findUnique({
      where: { id: target },
      select: { id: true, pharmacyId: true },
    });
    if (!listing) throw AppError.badRequest('Listing not found for banner action');
    if (options?.pharmacyId && listing.pharmacyId !== options.pharmacyId) {
      throw AppError.forbidden('Cannot advertise another seller listing');
    }
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

function normalizeTargetingInput<T extends Record<string, unknown>>(input: T) {
  return {
    ...input,
    targetCountry: typeof input.targetCountry === 'string' ? input.targetCountry.trim() || null : input.targetCountry ?? null,
    targetState: typeof input.targetState === 'string' ? input.targetState.trim() || null : input.targetState ?? null,
    targetCity: typeof input.targetCity === 'string' ? input.targetCity.trim() || null : input.targetCity ?? null,
  };
}

function assertEditableSellerBanner(banner: { status: BannerStatus; advertiserPharmacyId: string | null }, pharmacyId: string) {
  if (banner.advertiserPharmacyId !== pharmacyId) {
    throw AppError.forbidden('Advertisement not found');
  }
  const editableStatuses: BannerStatus[] = [BannerStatus.DRAFT, BannerStatus.PENDING_APPROVAL, BannerStatus.REJECTED];
  if (!editableStatuses.includes(banner.status)) {
    throw AppError.badRequest('Only draft, pending, or rejected advertisements can be edited');
  }
}

export class BannerService {
  async listActive(location: BannerUserLocation = {}): Promise<PublicBannerDto[]> {
    const banners = await prisma.homeBanner.findMany({
      include: bannerInclude,
      orderBy: [{ priority: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const ranked = filterAndRankBannersWithFallback(banners, location);
    return ranked.map(toPublicDto);
  }

  async listAdmin(filters?: { status?: BannerStatus; bannerType?: BannerType }) {
    return prisma.homeBanner.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.bannerType ? { bannerType: filters.bannerType } : {}),
      },
      include: bannerInclude,
      orderBy: [{ priority: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async listSellerAdvertisements(userId: string) {
    const pharmacy = await getPharmacyForUser(userId);
    return prisma.homeBanner.findMany({
      where: { advertiserPharmacyId: pharmacy.id, bannerType: BannerType.SELLER_AD },
      include: bannerInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async getById(id: string) {
    const banner = await prisma.homeBanner.findUnique({
      where: { id },
      include: bannerInclude,
    });
    if (!banner) throw AppError.notFound('Banner not found');
    return banner;
  }

  async getSellerAdvertisementById(userId: string, id: string) {
    const pharmacy = await getPharmacyForUser(userId);
    const banner = await this.getById(id);
    if (banner.advertiserPharmacyId !== pharmacy.id || banner.bannerType !== BannerType.SELLER_AD) {
      throw AppError.notFound('Advertisement not found');
    }
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
    bannerType?: BannerType;
    status?: BannerStatus;
    targetType?: Prisma.HomeBannerCreateInput['targetType'];
    targetCountry?: string | null;
    targetState?: string | null;
    targetCity?: string | null;
    targetLatitude?: number | null;
    targetLongitude?: number | null;
    radiusKm?: number | null;
    startsAt?: Date | null;
    endsAt?: Date | null;
    priority?: number;
    advertiserPharmacyId?: string | null;
    approvedById?: string | null;
    approvedAt?: Date | null;
  }) {
    const normalized = normalizeTargetingInput(input);
    const actionType = normalized.actionType ?? BannerActionType.NONE;
    await assertActionTarget(actionType, normalized.actionTarget);
    assertBannerMediaUrl(normalized.mediaUrl);
    const maxOrder = await prisma.homeBanner.aggregate({ _max: { sortOrder: true } });
    const sortOrder = normalized.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;
    const bannerType = normalized.bannerType ?? BannerType.ADMIN;
    const status = normalized.status ?? (bannerType === BannerType.ADMIN ? BannerStatus.ACTIVE : BannerStatus.DRAFT);
    return prisma.homeBanner.create({
      data: {
        title: normalized.title,
        subtitle: normalized.subtitle ?? null,
        mediaUrl: normalized.mediaUrl,
        mediaType: normalized.mediaType,
        mediaAlt: normalized.mediaAlt ?? null,
        ctaText: normalized.ctaText ?? null,
        actionType,
        actionTarget: normalized.actionTarget ?? null,
        isActive: normalized.isActive ?? status === BannerStatus.ACTIVE,
        sortOrder,
        bannerType,
        status,
        targetType: normalized.targetType ?? 'WORLDWIDE',
        targetCountry: normalized.targetCountry ?? null,
        targetState: normalized.targetState ?? null,
        targetCity: normalized.targetCity ?? null,
        targetLatitude: normalized.targetLatitude ?? null,
        targetLongitude: normalized.targetLongitude ?? null,
        radiusKm: normalized.radiusKm ?? null,
        startsAt: normalized.startsAt ?? null,
        endsAt: normalized.endsAt ?? null,
        priority: normalized.priority ?? sortOrder,
        advertiserPharmacyId: normalized.advertiserPharmacyId ?? null,
        approvedById: normalized.approvedById ?? null,
        approvedAt: normalized.approvedAt ?? null,
      },
      include: bannerInclude,
    });
  }

  async createSellerAdvertisement(userId: string, input: Record<string, unknown>) {
    const pharmacy = await getPharmacyForUser(userId);
    const normalized = normalizeTargetingInput(input);
    const actionType = normalized.actionType as BannerActionType;
    await assertActionTarget(actionType, normalized.actionTarget as string | null, { pharmacyId: pharmacy.id });
    assertBannerMediaUrl(normalized.mediaUrl as string);
    return prisma.homeBanner.create({
      data: {
        title: normalized.title as string,
        subtitle: (normalized.subtitle as string | null | undefined) ?? null,
        mediaUrl: normalized.mediaUrl as string,
        mediaType: normalized.mediaType as BannerMediaType,
        mediaAlt: (normalized.mediaAlt as string | null | undefined) ?? null,
        ctaText: (normalized.ctaText as string | null | undefined) ?? null,
        actionType,
        actionTarget: (normalized.actionTarget as string | null | undefined) ?? null,
        isActive: false,
        bannerType: BannerType.SELLER_AD,
        status: BannerStatus.PENDING_APPROVAL,
        advertiserPharmacyId: pharmacy.id,
        targetType: (normalized.targetType as Prisma.HomeBannerCreateInput['targetType']) ?? 'WORLDWIDE',
        targetCountry: (normalized.targetCountry as string | null | undefined) ?? null,
        targetState: (normalized.targetState as string | null | undefined) ?? null,
        targetCity: (normalized.targetCity as string | null | undefined) ?? null,
        targetLatitude: (normalized.targetLatitude as number | null | undefined) ?? null,
        targetLongitude: (normalized.targetLongitude as number | null | undefined) ?? null,
        radiusKm: (normalized.radiusKm as number | null | undefined) ?? null,
        startsAt: (normalized.startsAt as Date | null | undefined) ?? null,
        endsAt: (normalized.endsAt as Date | null | undefined) ?? null,
        priority: (normalized.priority as number | undefined) ?? 0,
      },
      include: bannerInclude,
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
    await assertActionTarget(actionType, actionTarget, {
      pharmacyId: existing.advertiserPharmacyId ?? undefined,
    });
    return prisma.homeBanner.update({
      where: { id },
      data,
      include: bannerInclude,
    });
  }

  async updateSellerAdvertisement(userId: string, id: string, input: Record<string, unknown>) {
    const pharmacy = await getPharmacyForUser(userId);
    const existing = await this.getSellerAdvertisementById(userId, id);
    assertEditableSellerBanner(existing, pharmacy.id);
    const normalized = normalizeTargetingInput(input);
    const actionType = (normalized.actionType as BannerActionType | undefined) ?? existing.actionType;
    const actionTarget =
      normalized.actionTarget !== undefined
        ? (normalized.actionTarget as string | null)
        : existing.actionTarget;
    await assertActionTarget(actionType, actionTarget, { pharmacyId: pharmacy.id });
    if (typeof normalized.mediaUrl === 'string') assertBannerMediaUrl(normalized.mediaUrl);
    return prisma.homeBanner.update({
      where: { id },
      data: {
        ...(normalized.title !== undefined ? { title: normalized.title as string } : {}),
        ...(normalized.subtitle !== undefined ? { subtitle: (normalized.subtitle as string | null) ?? null } : {}),
        ...(normalized.mediaUrl !== undefined ? { mediaUrl: normalized.mediaUrl as string } : {}),
        ...(normalized.mediaType !== undefined ? { mediaType: normalized.mediaType as BannerMediaType } : {}),
        ...(normalized.mediaAlt !== undefined ? { mediaAlt: (normalized.mediaAlt as string | null) ?? null } : {}),
        ...(normalized.ctaText !== undefined ? { ctaText: (normalized.ctaText as string | null) ?? null } : {}),
        ...(normalized.actionType !== undefined ? { actionType: normalized.actionType as BannerActionType } : {}),
        ...(normalized.actionTarget !== undefined ? { actionTarget: (normalized.actionTarget as string | null) ?? null } : {}),
        ...(normalized.targetType !== undefined ? { targetType: normalized.targetType as Prisma.HomeBannerUpdateInput['targetType'] } : {}),
        ...(normalized.targetCountry !== undefined ? { targetCountry: (normalized.targetCountry as string | null) ?? null } : {}),
        ...(normalized.targetState !== undefined ? { targetState: (normalized.targetState as string | null) ?? null } : {}),
        ...(normalized.targetCity !== undefined ? { targetCity: (normalized.targetCity as string | null) ?? null } : {}),
        ...(normalized.targetLatitude !== undefined ? { targetLatitude: (normalized.targetLatitude as number | null) ?? null } : {}),
        ...(normalized.targetLongitude !== undefined ? { targetLongitude: (normalized.targetLongitude as number | null) ?? null } : {}),
        ...(normalized.radiusKm !== undefined ? { radiusKm: (normalized.radiusKm as number | null) ?? null } : {}),
        ...(normalized.startsAt !== undefined ? { startsAt: (normalized.startsAt as Date | null) ?? null } : {}),
        ...(normalized.endsAt !== undefined ? { endsAt: (normalized.endsAt as Date | null) ?? null } : {}),
        ...(normalized.priority !== undefined ? { priority: normalized.priority as number } : {}),
        status: BannerStatus.PENDING_APPROVAL,
        rejectionReason: null,
        isActive: false,
      },
      include: bannerInclude,
    });
  }

  async cancelSellerAdvertisement(userId: string, id: string) {
    const pharmacy = await getPharmacyForUser(userId);
    const existing = await this.getSellerAdvertisementById(userId, id);
    assertEditableSellerBanner(existing, pharmacy.id);
    await prisma.homeBanner.delete({ where: { id } });
  }

  async approve(id: string, adminUserId: string) {
    const banner = await this.getById(id);
    const approvableStatuses: BannerStatus[] = [
      BannerStatus.PENDING_APPROVAL,
      BannerStatus.APPROVED,
      BannerStatus.PAUSED,
      BannerStatus.REJECTED,
    ];
    if (!approvableStatuses.includes(banner.status)) {
      throw AppError.badRequest('Advertisement cannot be approved in its current status');
    }
    const now = new Date();
    const shouldActivate = !banner.startsAt || banner.startsAt <= now;
    return prisma.homeBanner.update({
      where: { id },
      data: {
        status: shouldActivate ? BannerStatus.ACTIVE : BannerStatus.APPROVED,
        isActive: shouldActivate,
        approvedById: adminUserId,
        approvedAt: now,
        rejectionReason: null,
      },
      include: bannerInclude,
    });
  }

  async reject(id: string, adminUserId: string, rejectionReason: string) {
    const banner = await this.getById(id);
    if (banner.status !== BannerStatus.PENDING_APPROVAL) {
      throw AppError.badRequest('Only pending advertisements can be rejected');
    }
    return prisma.homeBanner.update({
      where: { id },
      data: {
        status: BannerStatus.REJECTED,
        isActive: false,
        rejectionReason,
        approvedById: adminUserId,
        approvedAt: new Date(),
      },
      include: bannerInclude,
    });
  }

  async pause(id: string) {
    const banner = await this.getById(id);
    const pausableStatuses: BannerStatus[] = [BannerStatus.ACTIVE, BannerStatus.APPROVED];
    if (!pausableStatuses.includes(banner.status)) {
      throw AppError.badRequest('Only active or approved banners can be paused');
    }
    return prisma.homeBanner.update({
      where: { id },
      data: { status: BannerStatus.PAUSED, isActive: false },
      include: bannerInclude,
    });
  }

  async resume(id: string) {
    const banner = await this.getById(id);
    if (banner.status !== BannerStatus.PAUSED) {
      throw AppError.badRequest('Only paused banners can be resumed');
    }
    const now = new Date();
    const effective = resolveBannerPublicStatus(banner, now);
    if (effective === BannerStatus.EXPIRED) {
      throw AppError.badRequest('Expired banners cannot be resumed');
    }
    const shouldActivate = !banner.startsAt || banner.startsAt <= now;
    return prisma.homeBanner.update({
      where: { id },
      data: {
        status: shouldActivate ? BannerStatus.ACTIVE : BannerStatus.APPROVED,
        isActive: shouldActivate,
      },
      include: bannerInclude,
    });
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
