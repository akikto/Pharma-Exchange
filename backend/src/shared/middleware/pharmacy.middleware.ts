import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../../config/database';
import { AppError } from '../errors/AppError';
import { VerificationStatus } from '@prisma/client';

export async function requireVerifiedPharmacy(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user!.userId } });
    if (!pharmacy) throw AppError.forbidden('Pharmacy registration required');
    if (pharmacy.verificationStatus !== VerificationStatus.APPROVED) {
      throw AppError.forbidden('Pharmacy verification required');
    }
    next();
  } catch (err) {
    next(err);
  }
}

export async function getPharmacyForUser(userId: string) {
  const pharmacy = await prisma.pharmacy.findUnique({ where: { userId } });
  if (!pharmacy) throw AppError.forbidden('Pharmacy registration required');
  return pharmacy;
}
