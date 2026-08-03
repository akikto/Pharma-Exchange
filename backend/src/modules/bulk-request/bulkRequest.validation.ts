import { z } from 'zod';
import { BulkExpiryPreset, BulkRequestUrgency } from '@prisma/client';

export const createBulkRequestSchema = z.object({
  medicineId: z.string().uuid(),
  quantity: z.number().int().positive(),
  targetPrice: z.number().positive(),
  urgency: z.nativeEnum(BulkRequestUrgency).default(BulkRequestUrgency.NORMAL),
  deliveryAddress: z.string().min(5),
  phone: z.string().min(10),
  requiresColdChain: z.boolean().default(false),
  requiresVatInvoice: z.boolean().default(false),
  requiresFactorySealed: z.boolean().default(false),
  expiryPreset: z.nativeEnum(BulkExpiryPreset),
  customExpiryDays: z.number().int().positive().optional(),
  note: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.expiryPreset === BulkExpiryPreset.CUSTOM && !data.customExpiryDays) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'customExpiryDays is required when expiry preset is CUSTOM',
      path: ['customExpiryDays'],
    });
  }
});

export const bulkRequestListSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});
