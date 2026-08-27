import { z } from 'zod';
import { DosageForm, ItemDeliveryMode, ListingStatus } from '@prisma/client';

const booleanQuery = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
}, z.boolean().optional());

export const createListingSchema = z.object({
  medicineId: z
    .string()
    .min(1, 'Medicine selection is required.')
    .uuid({ message: 'Medicine selection is required.' }),
  batchNumber: z.string().min(1),
  mfgDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  purchasePrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  discountPercent: z.number().min(0).max(100).default(0),
  availableQty: z.number().int().positive(),
  moq: z.number().int().positive().default(1),
  unit: z.string().default('strip'),
  lowStockThreshold: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  deliveryMode: z.nativeEnum(ItemDeliveryMode).default(ItemDeliveryMode.SELLER_DELIVERS),
  estimatedDeliveryDays: z.number().int().positive().optional(),
  status: z.nativeEnum(ListingStatus).default(ListingStatus.DRAFT),
});

export const updateListingSchema = createListingSchema.partial();

export const updatePriceSchema = z.object({
  sellingPrice: z.number().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
});

export const updateQuantitySchema = z.object({
  availableQty: z.number().int().positive(),
});

export const marketplaceSearchSchema = z.object({
  q: z.string().optional(),
  composition: z.string().optional(),
  company: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minDiscount: z.coerce.number().optional(),
  maxExpiryMonths: z.coerce.number().optional(),
  minExpiryMonths: z.coerce.number().optional(),
  pharmacyId: z.string().uuid().optional(),
  dosageForm: z.nativeEnum(DosageForm).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  verifiedOnly: booleanQuery,
  inStockOnly: booleanQuery,
  minAvailableQty: z.coerce.number().int().positive().optional(),
  maxExpiryDays: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['createdAt', 'price', 'expiry', 'discount', 'rating', 'distance', 'recommended']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.nativeEnum(ListingStatus).default(ListingStatus.ACTIVE),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radiusKm: z.coerce.number().default(2),
});

export const compareListingsSchema = z.object({
  medicineId: z.string().uuid(),
  sortBy: z.enum(['price', 'expiry', 'distance']).default('price'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export const inventoryQuerySchema = z.object({
  status: z.nativeEnum(ListingStatus).optional(),
  q: z.string().optional(),
  filter: z.enum(['low_stock']).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

export const restockSchema = z.object({
  amount: z.number().int().positive().default(50),
});
