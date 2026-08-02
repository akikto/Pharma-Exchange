import bcrypt from 'bcryptjs';
import { User, UserRole } from '@prisma/client';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { verifyFirebaseToken } from '../../config/firebase';
import { AppError } from '../../shared/errors/AppError';
import { generateOtp } from '../../shared/utils/helpers';
import { signAccessToken, signRefreshToken } from '../../shared/middleware/auth.middleware';
import { logger } from '../../shared/utils/logger';

export class AuthService {
  async register(data: {
    email?: string;
    phone?: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw AppError.conflict('Email already registered');
    }
    if (data.phone) {
      const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing) throw AppError.conflict('Phone already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        authProvider: data.email ? 'email' : 'phone',
      },
      select: { id: true, email: true, phone: true, firstName: true, lastName: true },
    });

    const otp = generateOtp();
    await prisma.otpToken.create({
      data: {
        userId: user.id,
        phone: data.phone,
        email: data.email,
        code: otp,
        purpose: 'registration',
        expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    if (env.OTP_DEV_MODE) logger.info(`[DEV OTP] Registration: ${otp}`);

    return { user, ...(env.OTP_DEV_MODE && { devOtp: otp }) };
  }

  async sendOtp(data: { phone?: string; email?: string; purpose: 'login' | 'password_reset' }) {
    const user = await prisma.user.findFirst({
      where: data.phone ? { phone: data.phone } : { email: data.email },
    });
    if (!user) throw AppError.notFound('No account found with this contact');
    if (!user.isActive) throw AppError.forbidden('Account is deactivated');

    const otp = generateOtp();
    await prisma.otpToken.create({
      data: {
        userId: user.id,
        phone: data.phone,
        email: data.email,
        code: otp,
        purpose: data.purpose,
        expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    if (env.OTP_DEV_MODE) logger.info(`[DEV OTP] ${data.purpose}: ${otp}`);

    return { message: 'OTP sent', ...(env.OTP_DEV_MODE && { devOtp: otp }) };
  }

  async login(data: { email?: string; phone?: string; password: string }) {
    const user = await prisma.user.findFirst({
      where: data.email ? { email: data.email } : { phone: data.phone },
    });

    if (!user || !user.passwordHash || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw AppError.unauthorized('Invalid credentials');
    }
    if (!user.isActive) throw AppError.forbidden('Account is deactivated');

    return this.issueTokens(user);
  }

  async firebaseAuth(idToken: string, firstName?: string, lastName?: string) {
    const decoded = await verifyFirebaseToken(idToken);
    if (!decoded) throw AppError.unauthorized('Invalid Firebase token');

    const provider = decoded.firebase?.sign_in_provider ?? 'firebase';
    const authProvider = provider.includes('google') ? 'google'
      : provider.includes('phone') ? 'phone' : 'email';

    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(decoded.email ? [{ email: decoded.email }] : []),
            ...(decoded.phone_number ? [{ phone: decoded.phone_number }] : []),
          ],
        },
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid: decoded.uid, authProvider },
        });
      } else {
        const nameParts = (decoded.name ?? '').split(' ');
        user = await prisma.user.create({
          data: {
            firebaseUid: decoded.uid,
            email: decoded.email ?? null,
            phone: decoded.phone_number ?? null,
            firstName: firstName ?? nameParts[0] ?? 'User',
            lastName: lastName ?? nameParts.slice(1).join(' ') ?? '',
            authProvider,
          },
        });
      }
    }

    if (!user.isActive) throw AppError.forbidden('Account is deactivated');
    return this.issueTokens(user);
  }

  async verifyOtp(data: { phone?: string; email?: string; code: string; purpose: string }) {
    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        code: data.code,
        purpose: data.purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
        ...(data.phone ? { phone: data.phone } : { email: data.email }),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) throw AppError.badRequest('Invalid or expired OTP');

    await prisma.otpToken.update({ where: { id: otpRecord.id }, data: { usedAt: new Date() } });

    if (otpRecord.userId) {
      const user = await prisma.user.findUnique({ where: { id: otpRecord.userId } });
      if (user) return this.issueTokens(user);
    }

    return { message: 'OTP verified' };
  }

  async refreshToken(token: string) {
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) throw AppError.unauthorized();

    await prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(user);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { userId, token: refreshToken } });
    } else {
      await prisma.refreshToken.deleteMany({ where: { userId } });
    }
    return { message: 'Logged out' };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, language: true, theme: true, authProvider: true,
        pharmacy: { select: { id: true, name: true, verificationStatus: true, rating: true } },
      },
    });
    if (!user) throw AppError.notFound('User not found');
    return user;
  }

  async registerFcmToken(userId: string, token: string, deviceId?: string, platform?: string) {
    const existing = await prisma.fcmToken.findUnique({ where: { token } });
    if (existing && existing.userId !== userId) {
      throw AppError.forbidden('FCM token belongs to another account');
    }
    return prisma.fcmToken.upsert({
      where: { token },
      create: { userId, token, deviceId, platform },
      update: { deviceId, platform },
    });
  }

  async removeFcmToken(userId: string, token: string) {
    await prisma.fcmToken.deleteMany({ where: { userId, token } });
    return { message: 'FCM token removed' };
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; language?: string; theme?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.language !== undefined ? { language: data.language } : {}),
        ...(data.theme !== undefined ? { theme: data.theme } : {}),
      },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, language: true, theme: true, authProvider: true,
        pharmacy: { select: { id: true, name: true, verificationStatus: true, rating: true } },
      },
    });
    return user;
  }

  private async issueTokens(user: User) {
    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}

export const authService = new AuthService();
