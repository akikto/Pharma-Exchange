import { z } from 'zod';
import { DosageForm } from '@prisma/client';

export const createMedicineSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  company: z.string().min(1),
  dosageForm: z.nativeEnum(DosageForm),
  strength: z.string().optional(),
  packSize: z.string().min(1),
  category: z.string().min(1),
  scheduleClass: z.string().optional(),
  composition: z.string().optional(),
  indications: z.string().optional(),
  dosageInstructions: z.string().optional(),
  sideEffects: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const updateMedicineSchema = createMedicineSchema.partial();
