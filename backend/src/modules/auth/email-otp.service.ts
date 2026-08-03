import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { generateOtp } from '../../shared/utils/helpers';
import { logger } from '../../shared/utils/logger';
import { signPasswordResetToken, verifyPasswordResetToken } from '../../shared/middleware/auth.middleware';
import { sendPasswordResetOtpEmail } from '../../shared/services/email.service';

/**
 * Email OTP service — password reset only.
 * Does NOT handle login; users authenticate via POST /auth/login (email + password).
 */

const GENERIC_OTP_MESSAGE = 'If an account exists with this email, a verification code has been sent.';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local[0]}***@${domain}`;
}

export class EmailOtpService {
  async requestPasswordResetOtp(email: string): Promise<{ message: string; devOtp?: string }> {
    const normalized = normalizeEmail(email);

    const recentCount = await prisma.emailOtp.count({
      where: {
        email: normalized,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });
    if (recentCount >= 5) {
      logger.warn('auth_event', { event: 'password_reset_otp_rate_limited', email: maskEmail(normalized) });
      throw AppError.tooManyRequests('Too many OTP requests. Please try again later.');
    }

    const latest = await prisma.emailOtp.findFirst({
      where: { email: normalized, verified: false },
      orderBy: { createdAt: 'desc' },
    });
    if (latest) {
      const cooldownMs = env.EMAIL_OTP_RESEND_COOLDOWN_SECONDS * 1000;
      const elapsed = Date.now() - latest.createdAt.getTime();
      if (elapsed < cooldownMs) {
        const waitSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
        throw AppError.tooManyRequests(`Please wait ${waitSeconds} seconds before requesting a new code.`);
      }
    }

    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user || !user.isActive) {
      logger.info('auth_event', { event: 'password_reset_otp_requested_unknown', email: maskEmail(normalized) });
      return { message: GENERIC_OTP_MESSAGE };
    }

    await prisma.emailOtp.deleteMany({
      where: { email: normalized, verified: false },
    });

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + env.EMAIL_OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.emailOtp.create({
      data: {
        email: normalized,
        hashedOtp,
        expiresAt,
      },
    });

    await sendPasswordResetOtpEmail(normalized, otp);

    logger.info('auth_event', { event: 'password_reset_otp_sent', email: maskEmail(normalized), userId: user.id });

    return {
      message: GENERIC_OTP_MESSAGE,
      ...(env.OTP_DEV_MODE && { devOtp: otp }),
    };
  }

  async verifyEmailOtp(email: string, code: string): Promise<{ resetToken: string; expiresIn: number }> {
    const normalized = normalizeEmail(email);

    const record = await prisma.emailOtp.findFirst({
      where: {
        email: normalized,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      logger.warn('auth_event', { event: 'password_reset_otp_verify_failed', reason: 'not_found_or_expired', email: maskEmail(normalized) });
      throw AppError.badRequest('Invalid or expired verification code.');
    }

    if (record.attempts >= env.EMAIL_OTP_MAX_ATTEMPTS) {
      await prisma.emailOtp.delete({ where: { id: record.id } });
      logger.warn('auth_event', { event: 'password_reset_otp_locked', email: maskEmail(normalized) });
      throw AppError.tooManyRequests('Too many failed attempts. Please request a new code.');
    }

    const isValid = await bcrypt.compare(code, record.hashedOtp);
    if (!isValid) {
      await prisma.emailOtp.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = env.EMAIL_OTP_MAX_ATTEMPTS - record.attempts - 1;
      logger.warn('auth_event', { event: 'password_reset_otp_invalid', email: maskEmail(normalized), remaining });
      throw AppError.badRequest(
        remaining > 0
          ? `Invalid verification code. ${remaining} attempt(s) remaining.`
          : 'Invalid verification code.',
      );
    }

    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user || !user.isActive) {
      await prisma.emailOtp.delete({ where: { id: record.id } });
      throw AppError.badRequest('Invalid or expired verification code.');
    }

    await prisma.emailOtp.delete({ where: { id: record.id } });

    const resetToken = signPasswordResetToken(normalized, user.id);
    const expiresIn = 15 * 60;

    logger.info('auth_event', { event: 'password_reset_otp_verified', email: maskEmail(normalized), userId: user.id });

    return { resetToken, expiresIn };
  }

  async resetPasswordWithToken(resetToken: string, newPassword: string) {
    let payload: { email: string; userId: string };
    try {
      payload = verifyPasswordResetToken(resetToken);
    } catch {
      logger.warn('auth_event', { event: 'password_reset_token_invalid' });
      throw AppError.unauthorized('Invalid or expired reset token. Please start again.');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive || user.email?.toLowerCase() !== payload.email.toLowerCase()) {
      throw AppError.unauthorized('Invalid or expired reset token. Please start again.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
      prisma.emailOtp.deleteMany({ where: { email: payload.email } }),
    ]);

    logger.info('auth_event', { event: 'password_reset_completed', userId: user.id, email: maskEmail(payload.email) });

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return { user: updated };
  }

  async cleanupExpiredOtps(): Promise<number> {
    const result = await prisma.emailOtp.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired email OTP record(s)`);
    }
    return result.count;
  }
}

export const emailOtpService = new EmailOtpService();
