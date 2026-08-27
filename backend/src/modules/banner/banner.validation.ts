import { z } from 'zod';
import { BannerActionType, BannerMediaType } from '@prisma/client';

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
};

export const createBannerSchema = z
  .object(bannerFields)
  .superRefine(actionTargetRefine);

export const updateBannerSchema = z
  .object({
    ...bannerFields,
    title: titleSchema.optional(),
    mediaUrl: z.string().trim().url().max(2048).optional(),
    mediaType: z.nativeEnum(BannerMediaType).optional(),
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
  });

export const reorderBannersSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

export const INTERNAL_BANNER_PATHS = INTERNAL_PATHS;
