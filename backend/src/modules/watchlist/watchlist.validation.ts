import { z } from 'zod';

export const addWatchlistSchema = z.object({
  medicineId: z.string().uuid(),
});

export const upsertPriceAlertSchema = z.object({
  medicineId: z.string().uuid(),
  maxPrice: z.number().positive(),
});

export const updatePriceAlertSchema = z.object({
  maxPrice: z.number().positive().optional(),
  isEnabled: z.boolean().optional(),
});

export const simulateAlertSchema = z.object({
  medicineId: z.string().uuid(),
  listingPrice: z.number().positive(),
});
