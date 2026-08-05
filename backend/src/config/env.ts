import { z } from 'zod';
import { assertProductionCorsConfig } from './cors';

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  OTP_EXPIRY_MINUTES: z.coerce.number().min(1).max(10080).default(10),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  LOG_LEVEL: z.string().default('info'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  // MSG91 SMS OTP provider (BL-01)
  MSG91_ENABLED: booleanFromEnv.default(false),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),
  MSG91_OTP_LENGTH: z.coerce.number().int().min(4).max(9).default(6),
  MSG91_BASE_URL: z.string().url().default('https://control.msg91.com/api/v5/otp'),
  // Razorpay payment gateway (BL-02)
  RAZORPAY_ENABLED: booleanFromEnv.default(false),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_CURRENCY: z.string().length(3).default('INR'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Environment validation failed');
  }
  const env = result.data;

  // ─── Production hardening (BL-03/BL-06) ────────────────────────────────
  if (env.NODE_ENV === 'production') {
    // JWT_SECRET must be a strong secret in production. 16 chars is fine for
    // dev/test but nowhere near sufficient for HS256 in prod.
    if (env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    assertProductionCorsConfig(env.NODE_ENV, env.CORS_ORIGIN);
    // DATABASE_URL must be a PostgreSQL DSN.
    if (!/^postgres(?:ql)?:\/\//.test(env.DATABASE_URL)) {
      throw new Error('DATABASE_URL must use the postgresql:// scheme');
    }
  }

  if (env.NODE_ENV === 'production' && env.MSG91_ENABLED) {
    const missing: string[] = [];
    if (!env.MSG91_AUTH_KEY) missing.push('MSG91_AUTH_KEY');
    if (!env.MSG91_SENDER_ID) missing.push('MSG91_SENDER_ID');
    if (!env.MSG91_TEMPLATE_ID) missing.push('MSG91_TEMPLATE_ID');
    if (missing.length > 0) {
      throw new Error(`MSG91_ENABLED=true but missing: ${missing.join(', ')}`);
    }
  }
  if (env.NODE_ENV === 'production' && env.RAZORPAY_ENABLED) {
    const missing: string[] = [];
    if (!env.RAZORPAY_KEY_ID) missing.push('RAZORPAY_KEY_ID');
    if (!env.RAZORPAY_KEY_SECRET) missing.push('RAZORPAY_KEY_SECRET');
    if (!env.RAZORPAY_WEBHOOK_SECRET) missing.push('RAZORPAY_WEBHOOK_SECRET');
    if (missing.length > 0) {
      throw new Error(`RAZORPAY_ENABLED=true but missing: ${missing.join(', ')}`);
    }
  }
  return env;
}

export const env = loadEnv();

export const isFirebaseConfigured = (): boolean =>
  Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);

export const isGeminiConfigured = (): boolean => Boolean(env.GEMINI_API_KEY);

export const isMsg91Configured = (): boolean =>
  Boolean(env.MSG91_ENABLED && env.MSG91_AUTH_KEY && env.MSG91_SENDER_ID && env.MSG91_TEMPLATE_ID);

export const isRazorpayConfigured = (): boolean =>
  Boolean(env.RAZORPAY_ENABLED && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_WEBHOOK_SECRET);
