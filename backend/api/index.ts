import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Application } from 'express';
import { getFirebaseStorageDiagnostics } from '../src/config/firebase-env';

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
  const firebase = getFirebaseStorageDiagnostics();
  res.status(200).json({
    status: 'ok',
    service: 'pharma-exchange-api',
    runtime: 'vercel-serverless',
    version: '1.0.0',
    env: {
      nodeEnv: process.env.NODE_ENV ?? 'unset',
      vercelEnv: process.env.VERCEL_ENV ?? 'unset',
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasJwtSecret: Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32),
      ...firebase,
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
