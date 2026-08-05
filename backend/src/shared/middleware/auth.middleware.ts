import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { UserRole } from '@prisma/client';
import { env } from '../../config/env';
import { verifyFirebaseToken } from '../../config/firebase';
import { AppError } from '../errors/AppError';
import prisma from '../../config/database';

export interface AuthUser {
  userId: string;
  role: UserRole;
  firebaseUid?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

interface TokenPayload {
  userId: string;
  role: UserRole;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, jti: randomUUID() }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyJwtToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized();
    }

    const token = header.slice(7);

    // Try JWT first
    try {
      const payload = verifyJwtToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || !user.isActive) throw AppError.unauthorized('Account inactive or not found');
      req.user = { userId: user.id, role: user.role, firebaseUid: user.firebaseUid ?? undefined };
      next();
      return;
    } catch {
      // Fall through to Firebase token verification
    }

    const decoded = await verifyFirebaseToken(token);
    if (!decoded) throw AppError.unauthorized('Invalid token');

    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
    if (!user) {
      user = await prisma.user.findFirst({
        where: { OR: [{ email: decoded.email }, { phone: decoded.phone_number }] },
      });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid: decoded.uid },
        });
      }
    }

    if (!user || !user.isActive) throw AppError.unauthorized('Account not found');
    req.user = { userId: user.id, role: user.role, firebaseUid: decoded.uid };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    next(AppError.forbidden('Admin access required'));
    return;
  }
  next();
}

export function requirePharmacy(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(AppError.unauthorized());
    return;
  }
  next();
}
