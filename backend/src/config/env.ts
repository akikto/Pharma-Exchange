import { z } from 'zod';
import { assertProductionCorsConfig } from './cors';
import { assertProductionPasswordResetConfig } from './password-reset-url';
import {
  getFirebaseStorageBucket,
  getFirebaseStorageDiagnostics,
} from './firebase-env';

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
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  PASSWORD_RESET_URL_BASE: z.string().url().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  LOG_LEVEL: z.string().default('info'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: booleanFromEnv.default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
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

  if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    assertProductionCorsConfig(env.NODE_ENV, env.CORS_ORIGIN);
    assertProductionPasswordResetConfig(env.NODE_ENV, env.PASSWORD_RESET_URL_BASE, env.CORS_ORIGIN);
    if (!/^postgres(?:ql)?:\/\//.test(env.DATABASE_URL)) {
      throw new Error('DATABASE_URL must use the postgresql:// scheme');
    }
    const smtpMissing: string[] = [];
    if (!env.SMTP_HOST) smtpMissing.push('SMTP_HOST');
    if (!env.SMTP_USER) smtpMissing.push('SMTP_USER');
    if (!env.SMTP_PASS) smtpMissing.push('SMTP_PASS');
    if (!env.MAIL_FROM) smtpMissing.push('MAIL_FROM');
    if (smtpMissing.length > 0) {
      throw new Error(`Production requires SMTP configuration: ${smtpMissing.join(', ')}`);
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

export const isFirebaseConfigured = (): boolean => {
  const diagnostics = getFirebaseStorageDiagnostics();
  return (
    diagnostics.firebaseProjectConfigured &&
    diagnostics.firebaseClientConfigured &&
    diagnostics.firebasePrivateKeyConfigured &&
    diagnostics.firebasePrivateKeyLooksValid
  );
};

export const isFirebaseStorageConfigured = (): boolean =>
  getFirebaseStorageDiagnostics().firebaseStorageConfigured;

export { getFirebaseStorageBucket, getFirebaseStorageDiagnostics, listMissingFirebaseStorageConfig };

export const isGeminiConfigured = (): boolean => Boolean(env.GEMINI_API_KEY);

export const isEmailConfigured = (): boolean =>
  Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.MAIL_FROM);

export const isRazorpayConfigured = (): boolean =>
  Boolean(env.RAZORPAY_ENABLED && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_WEBHOOK_SECRET);
