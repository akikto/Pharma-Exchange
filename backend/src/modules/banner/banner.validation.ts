import { z } from 'zod';
import {
  BannerActionType,
  BannerMediaType,
  BannerStatus,
  BannerTargetType,
  BannerType,
} from '@prisma/client';

const titleSchema = z.string().trim().min(1).max(120);
const subtitleSchema = z.string().trim().max(300).optional().nullable();
const ctaSchema = z.string().trim().max(60).optional().nullable();
const mediaAltSchema = z.string().trim().max(200).optional().nullable();

const INTERNAL_PATHS = [
  '/',
  '/search',
  '/watchlist',
  '/cart',
  '/notifications',
  '/profile',
  '/settings',
] as const;

function isValidExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function actionTargetRefine(
  data: { actionType: BannerActionType; actionTarget?: string | null },
  ctx: z.RefinementCtx,
) {
  const target = data.actionTarget?.trim() ?? '';
  switch (data.actionType) {
    case BannerActionType.NONE:
      return;
    case BannerActionType.EXTERNAL_URL:
      if (!target || !isValidExternalUrl(target)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valid http(s) URL required', path: ['actionTarget'] });
      }
      return;
    case BannerActionType.INTERNAL_PATH:
      if (!target || !INTERNAL_PATHS.includes(target as (typeof INTERNAL_PATHS)[number])) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid internal path', path: ['actionTarget'] });
      }
      return;
    case BannerActionType.MEDICINE:
    case BannerActionType.PHARMACY:
    case BannerActionType.CATEGORY:
    case BannerActionType.LISTING:
      if (!target) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Action target is required', path: ['actionTarget'] });
      }
      return;
    default:
      return;
  }
}

const targetingFields = {
  targetType: z.nativeEnum(BannerTargetType).default(BannerTargetType.WORLDWIDE),
  targetCountry: z.string().trim().max(120).optional().nullable(),
  targetState: z.string().trim().max(120).optional().nullable(),
  targetCity: z.string().trim().max(120).optional().nullable(),
  targetLatitude: z.number().finite().min(-90).max(90).optional().nullable(),
  targetLongitude: z.number().finite().min(-180).max(180).optional().nullable(),
  radiusKm: z.number().positive().max(5000).optional().nullable(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  priority: z.number().int().min(0).max(9999).optional(),
};

function targetingRefine(
  data: {
    targetType: BannerTargetType;
    targetCountry?: string | null;
    targetState?: string | null;
    targetCity?: string | null;
    targetLatitude?: number | null;
    targetLongitude?: number | null;
    radiusKm?: number | null;
    startsAt?: Date | null;
    endsAt?: Date | null;
  },
  ctx: z.RefinementCtx,
) {
  if (data.startsAt && data.endsAt && data.startsAt >= data.endsAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start date must be before end date', path: ['endsAt'] });
  }

  switch (data.targetType) {
    case BannerTargetType.WORLDWIDE:
      return;
    case BannerTargetType.COUNTRY:
      if (!data.targetCountry?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Country is required', path: ['targetCountry'] });
      }
      return;
    case BannerTargetType.REGION:
      if (!data.targetCountry?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Country is required', path: ['targetCountry'] });
      }
      if (!data.targetState?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'State/region is required', path: ['targetState'] });
      }
      return;
    case BannerTargetType.CITY:
      if (!data.targetCountry?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Country is required', path: ['targetCountry'] });
      }
      if (!data.targetState?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'State/region is required', path: ['targetState'] });
      }
      if (!data.targetCity?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City is required', path: ['targetCity'] });
      }
      return;
    case BannerTargetType.RADIUS:
      if (!data.targetCountry?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Country is required', path: ['targetCountry'] });
      }
      if (!data.targetState?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'State/region is required', path: ['targetState'] });
      }
      if (!data.targetCity?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City is required', path: ['targetCity'] });
      }
      if (data.targetLatitude == null || data.targetLongitude == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Coordinates are required for radius targeting', path: ['targetLatitude'] });
      }
      if (data.radiusKm == null || data.radiusKm <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Radius is required for radius targeting', path: ['radiusKm'] });
      }
      return;
    default:
      return;
  }
}

const bannerFields = {
  title: titleSchema,
  subtitle: subtitleSchema,
  mediaUrl: z.string().trim().url().max(2048),
  mediaType: z.nativeEnum(BannerMediaType),
  mediaAlt: mediaAltSchema,
  ctaText: ctaSchema,
  actionType: z.nativeEnum(BannerActionType).default(BannerActionType.NONE),
  actionTarget: z.string().trim().max(2048).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  bannerType: z.nativeEnum(BannerType).optional(),
  status: z.nativeEnum(BannerStatus).optional(),
  ...targetingFields,
};

export const createBannerSchema = z
  .object(bannerFields)
  .superRefine(actionTargetRefine)
  .superRefine(targetingRefine);

export const updateBannerSchema = z
  .object({
    ...bannerFields,
    title: titleSchema.optional(),
    mediaUrl: z.string().trim().url().max(2048).optional(),
    mediaType: z.nativeEnum(BannerMediaType).optional(),
    rejectionReason: z.string().trim().max(500).optional().nullable(),
  })
  .partial()
  .superRefine((data, ctx) => {
    if (data.actionType === undefined && data.actionTarget === undefined) return;
    actionTargetRefine(
      {
        actionType: data.actionType ?? BannerActionType.NONE,
        actionTarget: data.actionTarget,
      },
      ctx,
    );
  })
  .superRefine((data, ctx) => {
    if (data.targetType === undefined) return;
    targetingRefine(
      {
        targetType: data.targetType,
        targetCountry: data.targetCountry,
        targetState: data.targetState,
        targetCity: data.targetCity,
        targetLatitude: data.targetLatitude,
        targetLongitude: data.targetLongitude,
        radiusKm: data.radiusKm,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      },
      ctx,
    );
  });

export const reorderBannersSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

export const rejectBannerSchema = z.object({
  rejectionReason: z.string().trim().min(1).max(500),
});

export const listBannersQuerySchema = z.object({
  latitude: z.coerce.number().finite().min(-90).max(90).optional(),
  longitude: z.coerce.number().finite().min(-180).max(180).optional(),
  country: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
});

export const adminBannerListQuerySchema = z.object({
  status: z.nativeEnum(BannerStatus).optional(),
  bannerType: z.nativeEnum(BannerType).optional(),
});

export const createSellerAdvertisementSchema = z
  .object({
    title: titleSchema,
    subtitle: subtitleSchema,
    mediaUrl: z.string().trim().url().max(2048),
    mediaType: z.nativeEnum(BannerMediaType),
    mediaAlt: mediaAltSchema,
    ctaText: ctaSchema,
    actionType: z.nativeEnum(BannerActionType),
    actionTarget: z.string().trim().max(2048).optional().nullable(),
    ...targetingFields,
  })
  .superRefine(actionTargetRefine)
  .superRefine(targetingRefine)
  .superRefine((data, ctx) => {
    const allowed: BannerActionType[] = [BannerActionType.MEDICINE, BannerActionType.PHARMACY, BannerActionType.LISTING];
    if (!allowed.includes(data.actionType)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid click action for seller advertisement', path: ['actionType'] });
    }
  });

export const updateSellerAdvertisementSchema = z
  .object({
    title: titleSchema.optional(),
    subtitle: subtitleSchema,
    mediaUrl: z.string().trim().url().max(2048).optional(),
    mediaType: z.nativeEnum(BannerMediaType).optional(),
    mediaAlt: mediaAltSchema,
    ctaText: ctaSchema,
    actionType: z.nativeEnum(BannerActionType).optional(),
    actionTarget: z.string().trim().max(2048).optional().nullable(),
    ...targetingFields,
  })
  .superRefine((data, ctx) => {
    if (data.actionType === undefined && data.actionTarget === undefined) return;
    actionTargetRefine(
      {
        actionType: data.actionType ?? BannerActionType.NONE,
        actionTarget: data.actionTarget,
      },
      ctx,
    );
    if (data.actionType) {
      const allowed: BannerActionType[] = [BannerActionType.MEDICINE, BannerActionType.PHARMACY, BannerActionType.LISTING];
      if (!allowed.includes(data.actionType)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid click action for seller advertisement', path: ['actionType'] });
      }
    }
  })
  .superRefine((data, ctx) => {
    if (data.targetType === undefined) return;
    targetingRefine(
      {
        targetType: data.targetType,
        targetCountry: data.targetCountry,
        targetState: data.targetState,
        targetCity: data.targetCity,
        targetLatitude: data.targetLatitude,
        targetLongitude: data.targetLongitude,
        radiusKm: data.radiusKm,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      },
      ctx,
    );
  });

export const INTERNAL_BANNER_PATHS = INTERNAL_PATHS;
