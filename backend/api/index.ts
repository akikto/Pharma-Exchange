import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Application } from 'express';

let app: Application | null = null;
let bootstrapError: Error | null = null;

/** Paths that must respond without bootstrapping Express/Prisma on Vercel. */
const LIVENESS_PATHS = new Set(['/', '/health', '/api', '/api/']);

function requestPath(req: VercelRequest): string {
  const raw = req.url ?? '';
  const path = raw.split('?')[0] ?? '';
  return path || '/';
}

function isLivenessRequest(req: VercelRequest): boolean {
  return LIVENESS_PATHS.has(requestPath(req));
}

function sendLiveness(res: VercelResponse): void {
  // Deliberately minimal — never leak secret material or the state of PII.
  // Only booleans describing which providers are wired up.
  res.status(200).json({
    status: 'ok',
    service: 'pharma-exchange-api',
    runtime: 'vercel-serverless',
    version: '1.0.0',
    env: {
      nodeEnv: process.env.NODE_ENV ?? 'unset',
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasJwtSecret: Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32),
      firebaseConfigured: Boolean(
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY,
      ),
      emailConfigured: Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.MAIL_FROM,
      ),
      razorpayConfigured: Boolean(
        process.env.RAZORPAY_ENABLED === 'true' &&
        process.env.RAZORPAY_KEY_ID &&
        process.env.RAZORPAY_KEY_SECRET &&
        process.env.RAZORPAY_WEBHOOK_SECRET,
      ),
    },
  });
}

async function getApp(): Promise<Application> {
  if (bootstrapError) throw bootstrapError;
  if (app) return app;
  try {
    const { createApp } = await import('../src/app');
    app = createApp();
    return app;
  } catch (error) {
    bootstrapError = error instanceof Error ? error : new Error(String(error));
    throw bootstrapError;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (isLivenessRequest(req)) {
    sendLiveness(res);
    return;
  }

  try {
    const expressApp = await getApp();
    expressApp(req, res);
  } catch (error) {
    console.error('Serverless bootstrap failed:', error);
    // Never leak internal error strings or env details to the wire in prod.
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({
      error: 'Server bootstrap failed',
      code: 'BOOTSTRAP_ERROR',
      ...(isProd ? {} : {
        message: error instanceof Error ? error.message : String(error),
      }),
    });
  }
}
