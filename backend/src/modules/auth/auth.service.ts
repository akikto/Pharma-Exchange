import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { verifyFirebaseToken } from '../../config/firebase';
import { AppError } from '../../shared/errors/AppError';
import { signAccessToken, signRefreshToken } from '../../shared/middleware/auth.middleware';
import { resolvePasswordResetBaseUrl } from '../../config/password-reset-url';
import {
  EmailConfigError,
  EmailDeliveryError,
  isEmailConfigured,
  sendPasswordResetEmail,
} from '../../shared/services/email.service';
import { isValidProfilePhone, normalizePhoneToE164 } from '../../shared/utils/phone';

const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;
const GENERIC_RESET_MESSAGE =
  'If an account exists with this email, a password reset link has been sent.';

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
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
        email: data.email?.trim().toLowerCase(),
        phone: data.phone,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        authProvider: data.email ? 'email' : 'phone',
      },
    });

    return this.issueTokens(user);
  }

  async forgotPassword(data: { email: string }) {
    const email = data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.isActive && user.email) {
      if (!isEmailConfigured()) {
        throw new AppError(503, 'Email service is not configured', 'EMAIL_NOT_CONFIGURED');
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      const resetUrl = `${resolvePasswordResetBaseUrl({
        passwordResetUrlBase: env.PASSWORD_RESET_URL_BASE,
        corsOrigin: env.CORS_ORIGIN,
        nodeEnv: env.NODE_ENV,
      })}/reset-password?token=${rawToken}`;
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (err) {
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, tokenHash } });
        if (err instanceof EmailConfigError) {
          throw new AppError(503, 'Email service is not configured', 'EMAIL_NOT_CONFIGURED');
        }
        if (err instanceof EmailDeliveryError) {
          throw new AppError(502, 'Failed to send password reset email', 'EMAIL_DELIVERY_FAILED');
        }
        throw err;
      }
    }

    return { message: GENERIC_RESET_MESSAGE };
  }

  async resetPassword(data: { token: string; newPassword: string }) {
    const tokenHash = hashResetToken(data.token.trim());
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw AppError.badRequest('Invalid or expired reset token');
    }
    if (!record.user.isActive) throw AppError.forbidden('Account is deactivated');
    if (!record.user.passwordHash && !record.user.email) {
      throw AppError.badRequest('Password reset is not available for this account');
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: record.userId, id: { not: record.id }, usedAt: null },
      }),
    ]);

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
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      language?: string;
      theme?: string;
      notificationPrefs?: Record<string, boolean>;
    },
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

    let normalizedPhone: string | undefined;
    if (data.phone !== undefined) {
      if (!isValidProfilePhone(data.phone)) {
        throw AppError.badRequest('Invalid phone number');
      }
      normalizedPhone = normalizePhoneToE164(data.phone)!;
      const phoneOwner = await prisma.user.findFirst({
        where: { phone: normalizedPhone, id: { not: userId } },
      });
      if (phoneOwner) throw AppError.conflict('Phone already registered');
    }

    let normalizedEmail: string | undefined;
    if (data.email !== undefined) {
      normalizedEmail = data.email.trim().toLowerCase();
      const emailOwner = await prisma.user.findFirst({
        where: { email: normalizedEmail, id: { not: userId } },
      });
      if (emailOwner) throw AppError.conflict('Email already registered');
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName.trim() }),
        ...(data.lastName !== undefined && { lastName: data.lastName.trim() }),
        ...(normalizedEmail !== undefined && { email: normalizedEmail }),
        ...(normalizedPhone !== undefined && { phone: normalizedPhone }),
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

export const authService = new AuthService();
