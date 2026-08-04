import { z } from 'zod';

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
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Environment validation failed');
  }
  const env = result.data;
  if (env.NODE_ENV === 'production' && env.CORS_ORIGIN === '*') {
    console.warn('WARNING: CORS_ORIGIN is * in production. Set explicit origins.');
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
  return env;
}

export const env = loadEnv();

export const isFirebaseConfigured = (): boolean =>
  Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);

export const isGeminiConfigured = (): boolean => Boolean(env.GEMINI_API_KEY);

export const isMsg91Configured = (): boolean =>
  Boolean(env.MSG91_ENABLED && env.MSG91_AUTH_KEY && env.MSG91_SENDER_ID && env.MSG91_TEMPLATE_ID);
