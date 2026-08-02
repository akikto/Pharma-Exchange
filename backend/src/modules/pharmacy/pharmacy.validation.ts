import { z } from 'zod';
import { DocumentType, VerificationStatus } from '@prisma/client';

export const registerPharmacySchema = z.object({
  name: z.string().min(2),
  licenseNumber: z.string().min(1),
  address: z.string().min(5),
  city: z.string().min(2),
  district: z.string().min(2),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  description: z.string().optional(),
});

export const documentSchema = z.object({
  type: z.nativeEnum(DocumentType),
  fileUrl: z.string().url(),
  fileName: z.string(),
});

export const verifyPharmacySchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
});

export { VerificationStatus };
