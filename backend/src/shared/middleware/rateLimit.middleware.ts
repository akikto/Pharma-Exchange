import rateLimit, { type Options } from 'express-rate-limit';
import { env } from '../../config/env';

const isTestEnv = env.NODE_ENV === 'test';
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
  skip: (req) => isTestEnv || isAuthPath(req.path) || isAuthPath(req.originalUrl),
  message: rateLimitMessage(
    'অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
    'Too many requests',
  ),
});

export const authRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 60 : env.RATE_LIMIT_MAX,
  skip: () => isTestEnv,
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
  skip: () => isTestEnv,
  message: rateLimitMessage(
    'অনেকবার OTP চেয়েছেন। ১ মিনিট পর আবার চেষ্টা করুন।',
    'Too many OTP requests',
  ),
});
