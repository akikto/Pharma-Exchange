import { NextFunction, Response } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from './auth.middleware';
import { AppError } from '../errors/AppError';
import { requireVerifiedPharmacy } from './pharmacy.middleware';

export function requireAdminOrVerifiedPharmacy(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    next(AppError.unauthorized());
    return;
  }
  if (req.user.role === UserRole.ADMIN) {
    next();
    return;
  }
  void requireVerifiedPharmacy(req, res, next);
}
