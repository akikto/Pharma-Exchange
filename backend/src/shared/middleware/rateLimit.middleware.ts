import rateLimit, { type Options } from 'express-rate-limit';
import { env } from '../../config/env';

const isAuthPath = (path: string) => /\/auth(\/|$)/.test(path);

const rateLimitMessage = (bn: string, en: string) => ({
  error: bn,
  errorEn: en,
  code: 'RATE_LIMIT_EXCEEDED',
});

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
} satisfies Partial<Options>;

export const globalRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'production' ? 500 : env.RATE_LIMIT_MAX,
  skip: (req) => isAuthPath(req.path) || isAuthPath(req.originalUrl),
  message: rateLimitMessage(
    'অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
    'Too many requests',
  ),
});

export const authRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 60 : 100,
  keyGenerator: (req) => {
    const body = req.body as { email?: string; phone?: string } | undefined;
    const identity = body?.email || body?.phone;
    return identity ? `auth:${identity}` : `auth-ip:${req.ip}`;
  },
  message: rateLimitMessage(
    'অনেকবার লগইন চেষ্টা হয়েছে। ১৫ মিনিট পর আবার চেষ্টা করুন।',
    'Too many auth attempts',
  ),
});

export const otpRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const body = req.body as { email?: string } | undefined;
    return body?.email ? `otp:${body.email.toLowerCase()}` : `otp-ip:${req.ip}`;
  },
  message: rateLimitMessage(
    'অনেকবার OTP চেয়েছেন। ১ মিনিট পর আবার চেষ্টা করুন।',
    'Too many OTP requests',
  ),
});

export const emailOtpVerifyRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    const body = req.body as { email?: string } | undefined;
    return body?.email ? `otp-verify:${body.email.toLowerCase()}` : `otp-verify-ip:${req.ip}`;
  },
  message: rateLimitMessage(
    'অনেকবার ভুল কোড দিয়েছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।',
    'Too many verification attempts',
  ),
});
