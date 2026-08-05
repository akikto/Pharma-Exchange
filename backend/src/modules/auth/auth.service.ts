import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { verifyFirebaseToken } from '../../config/firebase';
import { AppError } from '../../shared/errors/AppError';
import { signAccessToken, signRefreshToken } from '../../shared/middleware/auth.middleware';
import {
  Msg91ConfigError,
  Msg91Error,
  msg91,
  normalizeBangladeshPhone,
} from '../../shared/services/msg91.service';

function mapMsg91Error(err: unknown): AppError {
  if (err instanceof Msg91ConfigError) {
    return AppError.badRequest('SMS OTP provider is not configured');
  }
  if (err instanceof Msg91Error) {
    if (err.code === 'OTP_PROVIDER_RATE_LIMIT') {
      return new AppError(429, 'Too many OTP requests. Please try again later.', 'RATE_LIMIT_EXCEEDED');
    }
    if (err.code === 'OTP_PROVIDER_UNAVAILABLE') {
      return new AppError(503, 'OTP provider unavailable. Please try again shortly.', 'OTP_PROVIDER_UNAVAILABLE');
    }
    return new AppError(502, 'OTP provider request failed', 'OTP_PROVIDER_ERROR');
  }
  const code = (err as { code?: string })?.code;
  if (code === 'INVALID_PHONE') return AppError.badRequest('Invalid Bangladesh mobile number');
  return AppError.internal('Unexpected OTP error');
}

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
    });

    // Phone-based registration must verify OTP before tokens are issued.
    if (data.phone) {
      try {
        const { requestId } = await msg91.sendOtp(data.phone);
        return {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          requiresOtpVerification: true,
          otpRequestId: requestId,
          message: 'Registration successful. Please verify the OTP sent to your phone.',
        };
      } catch (err) {
        throw mapMsg91Error(err);
      }
    }

    // Email-only registration: issue tokens immediately (email verification is
    // a separate flow, out of scope for BL-01).
    return this.issueTokens(user);
  }

  async sendOtp(data: { phone: string; purpose: 'login' | 'password_reset' }) {
    const normalizedPhone = normalizeBangladeshPhoneSafe(data.phone);
    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
      ?? await prisma.user.findUnique({ where: { phone: data.phone } });
    if (!user) throw AppError.notFound('No account found with this phone number');
    if (!user.isActive) throw AppError.forbidden('Account is deactivated');

    try {
      const { requestId } = await msg91.sendOtp(data.phone);
      return { message: 'OTP sent', requestId };
    } catch (err) {
      throw mapMsg91Error(err);
    }
  }

  async resendOtp(data: { phone: string }) {
    try {
      const { requestId } = await msg91.resendOtp(data.phone);
      return { message: 'OTP resent', requestId };
    } catch (err) {
      throw mapMsg91Error(err);
    }
  }

  async resetPassword(data: { phone: string; code: string; newPassword: string }) {
    let verified: boolean;
    try {
      verified = await msg91.verifyOtp(data.phone, data.code);
    } catch (err) {
      throw mapMsg91Error(err);
    }
    if (!verified) throw AppError.badRequest('Invalid or expired OTP');

    const normalizedPhone = normalizeBangladeshPhoneSafe(data.phone);
    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
      ?? await prisma.user.findFirst({ where: { phone: data.phone } });
    if (!user) throw AppError.notFound('No account found for this phone');
    if (!user.isActive) throw AppError.forbidden('Account is deactivated');

    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: 'Password updated successfully. Please sign in with your new password.' };
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

  async demoLogin() {
    if (env.NODE_ENV === 'production') {
      throw AppError.forbidden('Demo login is not available in production');
    }

    const user = await prisma.user.findUnique({ where: { email: 'buyer@pharmex.bd' } });
    if (!user) throw AppError.notFound('Demo account not found. Run database seed.');

    const tokens = await this.issueTokens(user);
    return { ...tokens, isDemo: true };
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

  async verifyOtp(data: { phone: string; code: string; purpose: 'registration' | 'login' | 'password_reset' }) {
    if (data.purpose === 'password_reset') {
      throw new AppError(
        400,
        'Use POST /auth/reset-password with your OTP and new password',
        'USE_RESET_PASSWORD_ENDPOINT',
      );
    }

    let verified: boolean;
    try {
      verified = await msg91.verifyOtp(data.phone, data.code);
    } catch (err) {
      throw mapMsg91Error(err);
    }
    if (!verified) throw AppError.badRequest('Invalid or expired OTP');

    const normalizedPhone = normalizeBangladeshPhoneSafe(data.phone);
    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
      ?? await prisma.user.findFirst({ where: { phone: data.phone } });
    if (!user) throw AppError.notFound('No account found for this phone');
    if (!user.isActive) throw AppError.forbidden('Account is deactivated');

    if (data.purpose === 'registration' && user.authProvider !== 'phone') {
      throw AppError.badRequest('OTP registration verification is only for phone sign-ups');
    }

    return this.issueTokens(user);
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
        role: true, language: true, theme: true, notificationPrefs: true, authProvider: true,
        pharmacy: { select: { id: true, name: true, verificationStatus: true, rating: true } },
      },
    });
    if (!user) throw AppError.notFound('User not found');
    return user;
  }

  async updateProfile(
    userId: string,
    data: { language?: string; theme?: string; notificationPrefs?: Record<string, boolean> },
  ) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });
    if (!existing) throw AppError.notFound('User not found');

    const currentPrefs =
      existing.notificationPrefs && typeof existing.notificationPrefs === 'object' && !Array.isArray(existing.notificationPrefs)
        ? (existing.notificationPrefs as Record<string, boolean>)
        : {};

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.language !== undefined && { language: data.language }),
        ...(data.theme !== undefined && { theme: data.theme }),
        ...(data.notificationPrefs !== undefined && {
          notificationPrefs: { ...currentPrefs, ...data.notificationPrefs },
        }),
      },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, language: true, theme: true, notificationPrefs: true, authProvider: true,
        pharmacy: { select: { id: true, name: true, verificationStatus: true, rating: true } },
      },
    });
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

  private async issueTokens(user: User) {
    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
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

function normalizeBangladeshPhoneSafe(phone: string): string {
  try {
    return normalizeBangladeshPhone(phone);
  } catch {
    return phone;
  }
}

export const authService = new AuthService();
